-- ============================================================
-- Feed Prism — Migration 03b: Deduplicate articles (RESILIENT / chunked)
-- Use this instead of 03 when 03 times out ("Failed to fetch").
-- ============================================================
-- HOW TO RUN: run ONE STEP AT A TIME in the Supabase SQL Editor.
-- Highlight a step, press Run, wait for "Success", then do the next step.
-- The CALL steps commit in batches: if you ever get "Failed to fetch",
-- just press Run on that same CALL line again — it resumes where it stopped.
-- ============================================================


-- ------------------------------------------------------------
-- STEP 1  — extension + canonicalization function (fast)
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

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
-- STEP 2  — add a helper column + index (fast)
-- ------------------------------------------------------------
alter table public.articles add column if not exists canonical_hash text;
create index if not exists idx_articles_canonical_hash on public.articles(canonical_hash);


-- ------------------------------------------------------------
-- STEP 3  — backfill canonical hashes in batches (RESUMABLE)
-- Run the CALL line. If it times out, just run the CALL line AGAIN.
-- ------------------------------------------------------------
create or replace procedure public.fp_backfill_canonical(batch int default 2000)
language plpgsql as $$
declare n int;
begin
  loop
    update public.articles
    set canonical_hash = encode(digest(public.fp_canonical_url(url), 'sha256'), 'hex')
    where id in (select id from public.articles where canonical_hash is null limit batch);
    get diagnostics n = row_count;
    commit;
    exit when n = 0;
  end loop;
end;
$$;

call public.fp_backfill_canonical(2000);

-- Confirm it finished (must return 0 before going on):
--   select count(*) from public.articles where canonical_hash is null;


-- ------------------------------------------------------------
-- STEP 4  — merge duplicates (transactional, uses the fast indexed column)
-- Re-points bookmarks / read-status to the keeper, then deletes extras.
-- ------------------------------------------------------------
begin;

create temporary table fp_dup_map on commit drop as
with ranked as (
  select id, canonical_hash,
    first_value(id) over (
      partition by canonical_hash order by created_at asc, id asc
    ) as keeper_id
  from public.articles
)
select id as loser_id, keeper_id from ranked where id <> keeper_id;

update public.bookmarks b set article_id = m.keeper_id
from fp_dup_map m
where b.article_id = m.loser_id
  and not exists (select 1 from public.bookmarks b2
                  where b2.user_id = b.user_id and b2.article_id = m.keeper_id);
delete from public.bookmarks b using fp_dup_map m where b.article_id = m.loser_id;

update public.read_articles r set article_id = m.keeper_id
from fp_dup_map m
where r.article_id = m.loser_id
  and not exists (select 1 from public.read_articles r2
                  where r2.user_id = r.user_id and r2.article_id = m.keeper_id);
delete from public.read_articles r using fp_dup_map m where r.article_id = m.loser_id;

delete from public.articles a using fp_dup_map m where a.id = m.loser_id;

commit;


-- ------------------------------------------------------------
-- STEP 5  — apply canonical hash to url_hash in batches (RESUMABLE)
-- Run the CALL line; re-run it if it times out.
-- ------------------------------------------------------------
create or replace procedure public.fp_apply_hash(batch int default 2000)
language plpgsql as $$
declare n int;
begin
  loop
    update public.articles
    set url_hash = canonical_hash
    where id in (select id from public.articles
                 where url_hash is distinct from canonical_hash limit batch);
    get diagnostics n = row_count;
    commit;
    exit when n = 0;
  end loop;
end;
$$;

call public.fp_apply_hash(2000);


-- ------------------------------------------------------------
-- STEP 6  — verify (must return 0) then clean up the helpers
-- ------------------------------------------------------------
select count(*) - count(distinct url_hash) as remaining_dupes from public.articles;

-- Once remaining_dupes = 0, optionally remove the scaffolding:
--   drop index if exists public.idx_articles_canonical_hash;
--   alter table public.articles drop column if exists canonical_hash;
--   drop procedure if exists public.fp_backfill_canonical(int);
--   drop procedure if exists public.fp_apply_hash(int);
