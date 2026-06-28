-- ============================================================
-- Feed Prism — Migration 05: Content-based deduplication (APPLIED in prod)
-- ============================================================
-- This is the migration that was actually applied to the Feed Prism database.
-- It SUPERSEDES the URL-only approach in 03_dedup_cleanup.sql / 03b — analysis
-- of real data showed the dominant duplicates were NOT url variants (only ~44)
-- but the same article re-ingested under rotating URLs (Google News issues a new
-- redirect URL every poll -> one article appeared 367x).
--
-- DEDUP KEY = source_id + normalized_title + publish_time
--   * collapses rotating-URL duplicates (same key, different URL)
--   * PRESERVES recurring daily columns ("Morning news brief", "Market Talk
--     Roundup") because each edition has a distinct publish time
--   * falls back to the canonical URL when an item has no publish date
--
-- The key is computed by a DB trigger so the app and DB can never disagree.
-- Inserts go through fp_ingest_articles(), which uses ON CONFLICT DO NOTHING
-- (untargeted) so a clash on EITHER url_hash or dedup_hash is silently skipped.
--
-- Idempotent; safe to run on another environment (e.g. staging).
-- Run sections in order. The CALL in section 3 must be run on its own line.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Canonical URL helper (used for the no-publish-date fallback)
-- ------------------------------------------------------------
create extension if not exists pgcrypto;   -- provides extensions.digest()

create or replace function public.fp_canonical_url(raw text)
returns text language plpgsql immutable as $$
declare
  s text; host_path text; qs text; params text[]; p text; k text; v text;
  kept text[] := '{}'; eqpos int;
begin
  if raw is null then return ''; end if;
  s := btrim(raw);
  s := split_part(s, '#', 1);
  s := regexp_replace(s, '^[a-zA-Z][a-zA-Z0-9+.-]*://', '');
  s := regexp_replace(s, '^www\.', '', 'i');
  if position('?' in s) > 0 then
    host_path := split_part(s, '?', 1);
    qs        := substring(s from position('?' in s) + 1);
  else
    host_path := s; qs := '';
  end if;
  host_path := lower(host_path);
  host_path := regexp_replace(host_path, '/+$', '');
  if qs <> '' then
    params := string_to_array(qs, '&');
    foreach p in array params loop
      if p = '' then continue; end if;
      eqpos := position('=' in p);
      if eqpos = 0 then k := lower(p); v := null;
      else k := lower(left(p, eqpos - 1)); v := substring(p from eqpos + 1); end if;
      if k in (
        'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
        'utm_id','utm_name','utm_reader','utm_brand','utm_social',
        'fbclid','gclid','dclid','gbraid','wbraid','msclkid','yclid',
        'mc_cid','mc_eid','igshid','ref','ref_src','referrer','source',
        'cmpid','ncid','sr_share','spm','__twitter_impression',
        '_hsenc','_hsmi','vero_id','oly_anon_id','oly_enc_id','guce_referrer'
      ) then continue; end if;
      kept := array_append(kept, case when v is null then k else k || '=' || v end);
    end loop;
    select array_agg(x order by split_part(x, '=', 1)) into kept from unnest(kept) as x;
    if kept is not null and array_length(kept, 1) > 0 then
      host_path := host_path || '?' || array_to_string(kept, '&');
    end if;
  end if;
  return host_path;
end;
$$;

-- ------------------------------------------------------------
-- 2. dedup_hash column + the trigger that fills it on every insert
-- ------------------------------------------------------------
alter table public.articles add column if not exists dedup_hash text;

create or replace function public.fp_set_dedup_hash()
returns trigger language plpgsql
set search_path = public, extensions
as $$
begin
  new.dedup_hash := encode(extensions.digest(
        coalesce(new.source_id::text,'') || '|' ||
        btrim(lower(regexp_replace(coalesce(new.title,''), '[^a-z0-9]+', ' ', 'g'))) || '|' ||
        case when new.published_at is not null
             then floor(extract(epoch from new.published_at))::bigint::text
             else public.fp_canonical_url(new.url) end
      , 'sha256'), 'hex');
  return new;
end;
$$;

drop trigger if exists trg_articles_dedup_hash on public.articles;
create trigger trg_articles_dedup_hash
  before insert on public.articles
  for each row execute function public.fp_set_dedup_hash();

-- ------------------------------------------------------------
-- 3. Backfill existing rows in self-committing batches (RESUMABLE).
--    Run the CALL on its OWN line. If the client times out, run it again —
--    committed batches persist and it resumes from where it stopped.
-- ------------------------------------------------------------
create or replace procedure public.fp_backfill_dedup(batch int default 15000)
language plpgsql as $$
declare n int;
begin
  loop
    update public.articles a
    set dedup_hash = encode(extensions.digest(
          coalesce(a.source_id::text,'') || '|' ||
          btrim(lower(regexp_replace(coalesce(a.title,''), '[^a-z0-9]+', ' ', 'g'))) || '|' ||
          case when a.published_at is not null
               then floor(extract(epoch from a.published_at))::bigint::text
               else public.fp_canonical_url(a.url) end
        , 'sha256'), 'hex')
    where a.ctid in (select ctid from public.articles where dedup_hash is null limit batch);
    get diagnostics n = row_count;
    commit;
    exit when n = 0;
  end loop;
end;
$$;

call public.fp_backfill_dedup(15000);
-- Confirm 0 before continuing:
--   select count(*) from public.articles where dedup_hash is null;

-- ------------------------------------------------------------
-- 4. Merge existing duplicates (keep oldest), re-pointing user data first.
-- ------------------------------------------------------------
create table if not exists public.fp_dup_map as
with ranked as (
  select id, dedup_hash,
    first_value(id) over (partition by dedup_hash order by created_at asc, id asc) as keeper_id
  from public.articles
)
select id as loser_id, keeper_id from ranked where id <> keeper_id;

update public.bookmarks b set article_id = m.keeper_id
from public.fp_dup_map m
where b.article_id = m.loser_id
  and not exists (select 1 from public.bookmarks b2 where b2.user_id=b.user_id and b2.article_id=m.keeper_id);
delete from public.bookmarks b using public.fp_dup_map m where b.article_id = m.loser_id;

update public.read_articles r set article_id = m.keeper_id
from public.fp_dup_map m
where r.article_id = m.loser_id
  and not exists (select 1 from public.read_articles r2 where r2.user_id=r.user_id and r2.article_id=m.keeper_id);
delete from public.read_articles r using public.fp_dup_map m where r.article_id = m.loser_id;

delete from public.articles a using public.fp_dup_map m where a.id = m.loser_id;
drop table public.fp_dup_map;

-- ------------------------------------------------------------
-- 5. Enforce dedup going forward
-- ------------------------------------------------------------
create unique index if not exists articles_dedup_hash_key on public.articles(dedup_hash);

-- ------------------------------------------------------------
-- 6. Insert RPC used by the app (lib/rss/ingest.js).
--    ON CONFLICT DO NOTHING (untargeted) ignores a clash on url_hash OR
--    dedup_hash. dedup_hash is omitted on purpose — the trigger fills it.
-- ------------------------------------------------------------
create or replace function public.fp_ingest_articles(payload jsonb)
returns integer language plpgsql security definer
set search_path = public
as $$
declare inserted_count int;
begin
  with rows as (
    select * from jsonb_to_recordset(payload) as x(
      source_id uuid, title text, description text, content text,
      image_url text, author text, category text, url text,
      url_hash text, published_at timestamptz
    )
  ),
  ins as (
    insert into public.articles
      (source_id, title, description, content, image_url, author, category, url, url_hash, published_at)
    select source_id, title, description, content, image_url, author, category, url, url_hash, published_at
    from rows
    where url is not null and title is not null
    on conflict do nothing
    returning 1
  )
  select count(*) into inserted_count from ins;
  return inserted_count;
end;
$$;

-- Lock the SECURITY DEFINER insert RPC to the service-role (admin) client only,
-- so it is NOT callable from the public REST API by anon/authenticated users.
revoke execute on function public.fp_ingest_articles(jsonb) from public, anon, authenticated;
grant  execute on function public.fp_ingest_articles(jsonb) to service_role;
alter  function public.fp_ingest_articles(jsonb) set search_path = public, extensions;
alter  function public.fp_canonical_url(text)    set search_path = pg_catalog, public;

-- ------------------------------------------------------------
-- 7. Verify (should be 0)
-- ------------------------------------------------------------
-- select count(*) - count(distinct dedup_hash) as remaining_dupes from public.articles;
