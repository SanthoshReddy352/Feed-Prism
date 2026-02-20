-- ============================================================
-- Feed Prism — Supabase Cron Job Setup
-- ============================================================
-- 1. Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- 2. REPLACE YOUR_VERCEL_URL with your actual deployment URL.
-- ============================================================

-- STEP 1: Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- STEP 2: Clear existing job if needed (prevents duplicates)
select cron.unschedule('ingest-feeds-production');

-- STEP 3: Schedule the ingestion job
-- Runs every 3 minutes (*/3 * * * *)
-- Each run calls the batched ingestion endpoint
select cron.schedule(
  'ingest-feeds-production',
  '*/3 * * * *',
  $$
  select net.http_get(
    url := 'https://YOUR_VERCEL_URL.vercel.app/api/ingest?secret=feedprism_cron_secret_2026',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);

-- ============================================================
-- HELPER QUERIES (Run these to monitor)
-- ============================================================

-- Check if the job is scheduled:
-- select * from cron.job;

-- View recent execution history:
-- select * from cron.job_run_details order by start_time desc limit 20;

-- Check ingestion logs in your public table:
-- select * from public.ingestion_logs order by created_at desc limit 50;
