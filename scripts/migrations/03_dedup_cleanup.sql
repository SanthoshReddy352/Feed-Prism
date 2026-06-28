-- ============================================================
-- Feed Prism — Migration 03: Deduplicate articles (URL canonicalization)
-- ============================================================
-- WHAT THIS DOES
--   1. Adds fp_canonical_url(): collapses tracking params, http/https, www,
--      trailing slashes and fragments to ONE canonical form. This MIRRORS
--      lib/rss/url-canonical.js so the app and DB agree on the dedup key.
--   2. Recomputes the dedup hash for every existing article.
--   3. Merges duplicate rows, re-pointing any bookmarks / read-status to the
--      surviving article so no user data is lost, then deletes the extras.
--   4. Rewrites url_hash to the canonical hash so NEW ingests stop creating
--      duplicates.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   It runs inside one transaction; if anything errors, nothing is committed.
--   Tip: run section [A] (the preview) on its own first to see how many dups exist.
-- ============================================================

create extension if not exists pgcrypto;   -- provides digest()

-- ------------------------------------------------------------
-- Canonicalization function (keep in sync with url-canonical.js)
-- ------------------------------------------------------------
create or replace function public.fp_canonical_url(raw text)
returns text
language plpgsql
immutable
as $$
declare
  s         text;
  host_path text;
  qs        text;
  params    text[];
  p         text;
  k         text;
  v         text;
  kept      text[] := '{}';
  eqpos     int;
begin
  if raw is null then return ''; end if;

  s := btrim(raw);
  s := split_part(s, '#', 1);                              -- drop fragment
  s := regexp_replace(s, '^[a-zA-Z][a-zA-Z0-9+.-]*://', ''); -- drop scheme
  s := regexp_replace(s, '^www\.', '', 'i');              -- drop leading www.

  if position('?' in s) > 0 then
    host_path := split_part(s, '?', 1);
    qs        := substring(s from position('?' in s) + 1);
  else
    host_path := s;
    qs        := '';
  end if;

  host_path := lower(host_path);                           -- lowercase host+path
  host_path := regexp_replace(host_path, '/+$', '');       -- strip trailing slash

  if qs <> '' then
    params := string_to_array(qs, '&');
    foreach p in array params loop
      if p = '' then continue; end if;
      eqpos := position('=' in p);
      if eqpos = 0 then
        k := lower(p); v := null;
      else
        k := lower(left(p, eqpos - 1));
        v := substring(p from eqpos + 1);
      end if;

      if k in (
        'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
        'utm_id','utm_name','utm_reader','utm_brand','utm_social',
        'fbclid','gclid','dclid','gbraid','wbraid','msclkid','yclid',
        'mc_cid','mc_eid','igshid','ref','ref_src','referrer','source',
        'cmpid','ncid','sr_share','spm','__twitter_impression',
        '_hsenc','_hsmi','vero_id','oly_anon_id','oly_enc_id','guce_referrer'
      ) then
        continue;  -- skip tracking params
      end if;

      kept := array_append(kept, case when v is null then k else k || '=' || v end);
    end loop;

    -- sort remaining params by key for a stable canonical form
    select array_agg(x order by split_part(x, '=', 1)) into kept from unnest(kept) as x;

    if kept is not null and array_length(kept, 1) > 0 then
      host_path := host_path || '?' || array_to_string(kept, '&');
    end if;
  end if;

  return host_path;
end;
$$;

-- ============================================================
-- [A] PREVIEW (safe, read-only). Run this alone first if you want.
-- ============================================================
-- How many duplicate rows will be merged:
--   select count(*) - count(distinct encode(digest(public.fp_canonical_url(url),'sha256'),'hex')) as duplicates_to_remove
--   from public.articles;
-- See some examples:
--   select public.fp_canonical_url(url) as canon, count(*), array_agg(url)
--   from public.articles group by 1 having count(*) > 1 order by 2 desc limit 25;

-- ============================================================
-- [B] CLEANUP (transactional)
-- ============================================================
begin;

-- Map every losing duplicate -> the keeper (oldest row wins).
create temporary table fp_dup_map on commit drop as
with c as (
  select
    id,
    created_at,
    encode(digest(public.fp_canonical_url(url), 'sha256'), 'hex') as new_hash
  from public.articles
),
ranked as (
  select
    id,
    new_hash,
    first_value(id) over (
      partition by new_hash
      order by created_at asc, id asc
    ) as keeper_id
  from c
)
select id as loser_id, keeper_id
from ranked
where id <> keeper_id;

-- Re-point bookmarks from losers to keepers (skip if user already has keeper).
update public.bookmarks b
set article_id = m.keeper_id
from fp_dup_map m
where b.article_id = m.loser_id
  and not exists (
    select 1 from public.bookmarks b2
    where b2.user_id = b.user_id and b2.article_id = m.keeper_id
  );
-- Drop any bookmarks still pointing at a loser (keeper was already bookmarked).
delete from public.bookmarks b using fp_dup_map m where b.article_id = m.loser_id;

-- Same for read-status.
update public.read_articles r
set article_id = m.keeper_id
from fp_dup_map m
where r.article_id = m.loser_id
  and not exists (
    select 1 from public.read_articles r2
    where r2.user_id = r.user_id and r2.article_id = m.keeper_id
  );
delete from public.read_articles r using fp_dup_map m where r.article_id = m.loser_id;

-- Delete the duplicate articles.
delete from public.articles a using fp_dup_map m where a.id = m.loser_id;

-- Rewrite every surviving row's hash to the canonical value so the app's
-- ON CONFLICT (url_hash) guard matches going forward.
update public.articles
set url_hash = encode(digest(public.fp_canonical_url(url), 'sha256'), 'hex');

commit;

-- ============================================================
-- [C] VERIFY (should return 0)
-- ============================================================
-- select count(*) - count(distinct url_hash) as remaining_dupes from public.articles;
