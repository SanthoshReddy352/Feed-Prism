-- ============================================================
-- NewsDash — Schema Patch: Allow 'batch_state' in ingestion_logs
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- ============================================================

-- Drop the old check constraint and add a new one that includes 'batch_state'
alter table public.ingestion_logs drop constraint if exists ingestion_logs_status_check;
alter table public.ingestion_logs add constraint ingestion_logs_status_check
    check (status in ('success', 'error', 'batch_state'));
