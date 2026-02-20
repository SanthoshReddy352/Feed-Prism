# System Design & Engineering Document

This document extends the Technical Architecture and provides complete system design, database schema (production-ready SQL), API contracts, DevOps architecture, ingestion architecture, security hardening, and implementation roadmap.

============================================================
1. SYSTEM DESIGN DOCUMENT
============================================================

1.1 Design Goals

- High read throughput
- Reliable RSS ingestion
- Zero duplicate articles
- Secure multi-user isolation
- Low operational overhead

1.2 Architectural Style

- Modular monolith (Next.js full-stack)
- Managed database (Supabase PostgreSQL)
- Event-driven ingestion (cron-triggered)
- Stateless application servers

1.3 Logical Components

1. Presentation Layer
   - Next.js React components
   - Server Components + Client Components

2. Application Layer
   - Route Handlers
   - Server Actions
   - Middleware (auth guard)

3. Ingestion Layer
   - Edge Function (cron triggered)
   - Feed parser
   - Deduplication service

4. Data Layer
   - PostgreSQL
   - RLS policies
   - Full-text search index

============================================================
2. SYSTEM DESIGN DIAGRAM EXPLANATION
============================================================

Flow Description:

User Browser
  → Next.js App (SSR/ISR)
      → API Route / Server Action
          → Supabase Postgres

Background Flow:

Cron Scheduler
  → Supabase Edge Function
      → Fetch RSS Feeds
          → Normalize Data
              → Insert into DB

Security Boundary:
- Public client uses anon key
- Server uses service role key
- RLS enforces ownership

============================================================
3. PRODUCTION-READY DATABASE SCHEMA (SQL)
============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- USERS handled by Supabase auth.users

create table sources (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    rss_url text not null unique,
    category text not null,
    is_active boolean default true,
    created_at timestamptz default now()
);

create table articles (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid references sources(id) on delete cascade,
    title text not null,
    description text,
    content text,
    image_url text,
    category text not null,
    url text not null,
    url_hash text not null,
    published_at timestamptz,
    created_at timestamptz default now(),
    constraint unique_url_hash unique(url_hash)
);

create index idx_articles_published_at on articles(published_at desc);
create index idx_articles_category on articles(category);
create index idx_articles_source on articles(source_id);

-- Full text search
alter table articles add column search_vector tsvector;
create index idx_articles_search on articles using gin(search_vector);

create table bookmarks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    article_id uuid references articles(id) on delete cascade,
    created_at timestamptz default now(),
    unique(user_id, article_id)
);

create table user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preferred_categories text[],
    preferred_sources uuid[],
    created_at timestamptz default now()
);

create table ingestion_logs (
    id uuid primary key default uuid_generate_v4(),
    source_id uuid,
    status text,
    message text,
    created_at timestamptz default now()
);

============================================================
4. API CONTRACT DEFINITIONS
============================================================

All responses JSON.
Authentication: Bearer JWT (Supabase).

4.1 GET /api/articles

Query Params:
- category
- source
- page
- limit
- search

Response:
{
  "data": [Article],
  "pagination": {
     "page": 1,
     "limit": 20,
     "total": 340
  }
}

4.2 GET /api/articles/:id

Response:
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "source": "string",
  "published_at": "timestamp"
}

4.3 POST /api/bookmarks

Body:
{
  "article_id": "uuid"
}

Response:
{
  "success": true
}

4.4 DELETE /api/bookmarks/:article_id

Response:
{
  "success": true
}

4.5 GET /api/bookmarks

Response:
{
  "data": [Article]
}

============================================================
5. BACKGROUND JOB ARCHITECTURE
============================================================

Trigger: Supabase Scheduled Edge Function (every 15 minutes)

Steps:
1. Fetch active sources
2. Parallel RSS fetch
3. Parse XML
4. Generate SHA256 hash of URL
5. Check existence
6. Insert if not exists
7. Update search_vector
8. Log ingestion status

Failure Handling:
- Retry twice
- Log error
- Continue processing other feeds

============================================================
6. DEVOPS / CI-CD ARCHITECTURE
============================================================

Source Control: GitHub

Branch Strategy:
- main (production)
- dev (staging)

Pipeline:

1. Push to GitHub
2. GitHub Actions
   - Install dependencies
   - Run ESLint
   - Run TypeScript check
   - Run unit tests
   - Build Next.js
3. Deploy to Vercel

Database Migrations:
- SQL migration files
- Applied via Supabase CLI

Environment Management:
- .env.local (development)
- Vercel environment variables

============================================================
7. SECURITY HARDENING DOCUMENT
============================================================

7.1 Database Security
- Enable RLS on bookmarks and user_preferences
- Policies:
  user_id = auth.uid()

7.2 API Security
- Validate input with Zod
- Rate limit API routes
- Use server-only service role key

7.3 Content Security
- Sanitize HTML content
- Strip script tags

7.4 Network Security
- Enforce HTTPS
- Secure cookies

7.5 Secrets Management
- Never expose service role key
- Store in Vercel encrypted env

============================================================
8. STEP-BY-STEP IMPLEMENTATION PLAN
============================================================

Phase 1: Project Setup
- Create Next.js project
- Setup Supabase project
- Configure environment variables

Phase 2: Database Setup
- Run SQL schema
- Enable RLS
- Create indexes

Phase 3: Basic UI
- Build article listing page
- Connect to Supabase

Phase 4: Ingestion Layer
- Create Edge Function
- Implement parser
- Test deduplication

Phase 5: Authentication
- Implement login/signup
- Protect routes

Phase 6: Search
- Implement FTS
- Add search API

Phase 7: DevOps
- Setup GitHub Actions
- Configure Vercel deployment

Phase 8: Hardening
- Add validation
- Add logging
- Add rate limiting

============================================================

End of Engineering System Design Document.

