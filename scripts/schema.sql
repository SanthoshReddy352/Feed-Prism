-- ============================================================
-- Feed Prism — Complete Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Sources: RSS feed configurations
create table if not exists public.sources (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    rss_url text not null unique,
    category text not null,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- Articles: fetched news articles
create table if not exists public.articles (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references public.sources(id) on delete cascade,
    title text not null,
    description text,
    content text,
    image_url text,
    author text,
    category text not null,
    url text not null,
    url_hash text not null,
    published_at timestamptz,
    created_at timestamptz default now(),
    search_vector tsvector,
    constraint unique_url_hash unique(url_hash)
);

-- Bookmarks: user article bookmarks
create table if not exists public.bookmarks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    article_id uuid references public.articles(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(user_id, article_id)
);

-- User Preferences: preferred categories & sources
create table if not exists public.user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preferred_categories text[] default '{}',
    preferred_sources uuid[] default '{}',
    view_mode text default 'detailed' check (view_mode in ('compact', 'detailed')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Read Articles: track read/unread status per user
create table if not exists public.read_articles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    article_id uuid references public.articles(id) on delete cascade not null,
    read_at timestamptz default now(),
    unique(user_id, article_id)
);

-- Ingestion Logs: feed fetch success/failure logs
create table if not exists public.ingestion_logs (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references public.sources(id) on delete set null,
    status text not null check (status in ('success', 'error')),
    articles_count integer default 0,
    message text,
    created_at timestamptz default now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_source on public.articles(source_id);
create index if not exists idx_articles_url_hash on public.articles(url_hash);
create index if not exists idx_articles_search on public.articles using gin(search_vector);
create index if not exists idx_articles_created_at on public.articles(created_at desc);

create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_bookmarks_article on public.bookmarks(article_id);

create index if not exists idx_read_articles_user on public.read_articles(user_id);
create index if not exists idx_read_articles_article on public.read_articles(article_id);

create index if not exists idx_ingestion_logs_source on public.ingestion_logs(source_id);
create index if not exists idx_ingestion_logs_created on public.ingestion_logs(created_at desc);

-- ============================================================
-- 4. FULL-TEXT SEARCH TRIGGER
-- ============================================================

-- Function to auto-update search_vector when title/description changes
create or replace function public.articles_search_vector_update()
returns trigger as $$
begin
    new.search_vector :=
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
    return new;
end;
$$ language plpgsql;

-- Trigger on insert or update
drop trigger if exists trigger_articles_search_vector on public.articles;
create trigger trigger_articles_search_vector
    before insert or update of title, description
    on public.articles
    for each row
    execute function public.articles_search_vector_update();

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all user-owned tables
alter table public.bookmarks enable row level security;
alter table public.user_preferences enable row level security;
alter table public.read_articles enable row level security;

-- Articles & sources are PUBLIC read (no RLS needed for reads)
-- but we still enable RLS for safety on sources
alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.ingestion_logs enable row level security;

-- Sources: anyone can read, only service role can write
create policy "Sources are publicly readable"
    on public.sources for select
    using (true);

-- Articles: anyone can read, only service role can write
create policy "Articles are publicly readable"
    on public.articles for select
    using (true);

-- Bookmarks: users can only CRUD their own bookmarks
create policy "Users can view own bookmarks"
    on public.bookmarks for select
    using (auth.uid() = user_id);

create policy "Users can create own bookmarks"
    on public.bookmarks for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
    on public.bookmarks for delete
    using (auth.uid() = user_id);

-- User Preferences: users can only CRUD their own preferences
create policy "Users can view own preferences"
    on public.user_preferences for select
    using (auth.uid() = user_id);

create policy "Users can create own preferences"
    on public.user_preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can update own preferences"
    on public.user_preferences for update
    using (auth.uid() = user_id);

-- Read Articles: users can only CRUD their own read status
create policy "Users can view own read articles"
    on public.read_articles for select
    using (auth.uid() = user_id);

create policy "Users can mark articles as read"
    on public.read_articles for insert
    with check (auth.uid() = user_id);

create policy "Users can unmark articles as read"
    on public.read_articles for delete
    using (auth.uid() = user_id);

-- Ingestion Logs: publicly readable for dashboard stats
create policy "Ingestion logs are publicly readable"
    on public.ingestion_logs for select
    using (true);

-- ============================================================
-- 6. AUTO-UPDATE updated_at on user_preferences
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_user_preferences_updated_at on public.user_preferences;
create trigger trigger_user_preferences_updated_at
    before update on public.user_preferences
    for each row
    execute function public.handle_updated_at();

-- ============================================================
-- DONE! All tables, indexes, RLS, and triggers are set up.
-- Next: Run seed-sources.sql to populate RSS feeds.
-- ============================================================
