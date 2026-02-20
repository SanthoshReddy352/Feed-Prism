-- ============================================================
-- Feed Prism — Supabase Cron Job Setup
-- ============================================================
-- This script sets up automatic RSS ingestion using pg_cron.
-- Run this in Supabase SQL Editor.
--
-- ARCHITECTURE:
--   pg_cron → pg_net HTTP GET → /api/ingest → batched ingestion
--
-- BATCH BEHAVIOR:
--   - Each call processes ~10 sources (one batch)
--   - With ~50 sources, there are 5 batches
--   - Cron runs every 3 minutes
--   - Full cycle completes every ~15 minutes
--   - Each call takes 3-5 seconds (well under Vercel's 10s limit)
-- ============================================================


-- ============================================================
-- STEP 1: Enable required extensions
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;


-- ============================================================
-- STEP 2: LOCAL DEVELOPMENT setup
-- ============================================================
-- Use this when running `npm run dev` on localhost.
-- NOTE: pg_net CANNOT reach localhost from Supabase cloud.
-- For local dev, use one of these alternatives:
--
-- OPTION A: Use an ngrok/cloudflare tunnel to expose localhost:
--   1. Install ngrok: https://ngrok.com/
--   2. Run: ngrok http 3000
--   3. Replace the URL below with your ngrok URL
--
-- OPTION B: Manual trigger (no cron needed):
--   Just visit: http://localhost:3000/api/ingest?mode=full
--
-- OPTION C: Use a local cron (PowerShell scheduled task / crontab):
--   See the PowerShell script at the bottom of this file.

-- Uncomment and modify for ngrok tunnel:
-- select cron.schedule(
--   'ingest-feeds-local',
--   '*/3 * * * *',
--   $$
--   select net.http_get(
--     url := 'https://YOUR-NGROK-URL.ngrok-free.app/api/ingest?secret=YOUR_CRON_SECRET',
--     headers := '{"Content-Type": "application/json"}'::jsonb
--   ) as request_id;
--   $$
-- );


-- ============================================================
-- STEP 3: PRODUCTION setup (Vercel deployment)
-- ============================================================
-- Replace YOUR_VERCEL_URL and YOUR_CRON_SECRET before running.

-- >>> UNCOMMENT AND MODIFY THE BLOCK BELOW <<<

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
-- USEFUL QUERIES
-- ============================================================

-- View scheduled cron jobs:
-- select * from cron.job;

-- View last 20 cron executions:
-- select * from cron.job_run_details order by start_time desc limit 20;

-- View ingestion logs (our custom table):
-- select * from public.ingestion_logs
--   where status != 'batch_state'
--   order by created_at desc
--   limit 50;

-- Check current batch index:
-- select message as next_batch_index, created_at
--   from public.ingestion_logs
--   where status = 'batch_state'
--   order by created_at desc
--   limit 1;

-- Unschedule a cron job:
-- select cron.unschedule('ingest-feeds-production');
-- select cron.unschedule('ingest-feeds-local');


-- ============================================================
-- ALTERNATIVE: Local PowerShell Scheduled Task
-- ============================================================
-- Save the following as ingest-cron.ps1 and run it:
--
--   while ($true) {
--     try {
--       $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ingest?secret=YOUR_CRON_SECRET" -TimeoutSec 30
--       $timestamp = Get-Date -Format "HH:mm:ss"
--       Write-Host "[$timestamp] Ingestion: $($response.StatusCode)" -ForegroundColor Green
--     } catch {
--       $timestamp = Get-Date -Format "HH:mm:ss"
--       Write-Host "[$timestamp] Error: $_" -ForegroundColor Red
--     }
--     Start-Sleep -Seconds 180  # 3 minutes
--   }
--
-- Run with: powershell -File .\ingest-cron.ps1
