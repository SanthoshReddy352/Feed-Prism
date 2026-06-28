-- ============================================================
-- Feed Prism — Migration 04: Conditional GET, source health, retention
-- ============================================================
-- Run AFTER 03_dedup_cleanup.sql, in the Supabase SQL Editor.
-- Safe to run more than once (everything is IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Per-source conditional-GET + health columns
--    Used by lib/rss/ingest.js to skip unchanged feeds (304 Not Modified)
--    and to track which feeds are failing.
-- ------------------------------------------------------------
alter table public.sources
  add column if not exists etag                 text,
  add column if not exists last_modified        text,
  add column if not exists last_fetched_at      timestamptz,
  add column if not exists last_status          text,
  add column if not exists consecutive_failures integer not null default 0;

-- Helps a future "fetch the least-recently-updated feeds first" strategy
-- and lets you find dead feeds quickly.
create index if not exists idx_sources_last_fetched
  on public.sources(last_fetched_at asc nulls first);

-- Find feeds that have been failing repeatedly (consider deactivating them):
--   select name, rss_url, consecutive_failures, last_status, last_fetched_at
--   from public.sources
--   where consecutive_failures >= 5
--   order by consecutive_failures desc;

-- ------------------------------------------------------------
-- 2. Drop the redundant url_hash index.
--    The unique constraint unique_url_hash already creates an index, so
--    idx_articles_url_hash is duplicated work on every insert.
-- ------------------------------------------------------------
drop index if exists public.idx_articles_url_hash;

-- ------------------------------------------------------------
-- 3. Retention: keep the feed lean. Deletes articles older than N days
--    EXCEPT any a user has bookmarked. Returns the number deleted.
-- ------------------------------------------------------------
create or replace function public.fp_prune_old_articles(keep_days integer default 45)
returns integer
language plpgsql
as $$
declare
  deleted integer;
begin
  with del as (
    delete from public.articles a
    where a.published_at < now() - make_interval(days => keep_days)
      and not exists (select 1 from public.bookmarks b where b.article_id = a.id)
    returning 1
  )
  select count(*) into deleted from del;
  return deleted;
end;
$$;

-- Prune the ingestion_logs table too (it grows by one row every cron run).
create or replace function public.fp_prune_ingestion_logs(keep_days integer default 7)
returns integer
language plpgsql
as $$
declare
  deleted integer;
begin
  with del as (
    delete from public.ingestion_logs
    where created_at < now() - make_interval(days => keep_days)
      and status <> 'batch_state'           -- never delete the batch cursor
    returning 1
  )
  select count(*) into deleted from del;
  return deleted;
end;
$$;

-- Run retention now (one-off):
--   select public.fp_prune_old_articles(45);
--   select public.fp_prune_ingestion_logs(7);

-- Optional: schedule daily retention via pg_cron (requires pg_cron enabled).
--   select cron.schedule('fp-retention', '17 3 * * *',
--     $$ select public.fp_prune_old_articles(45); select public.fp_prune_ingestion_logs(7); $$);
