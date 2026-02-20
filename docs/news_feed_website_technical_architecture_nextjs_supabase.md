# Technical Architecture Document

## 1. System Overview

The Personal News Dashboard is a web-based RSS aggregation platform built using Next.js (App Router) and Supabase (PostgreSQL, Auth, Storage). The system follows a modern full-stack architecture where the frontend and backend logic are handled within Next.js, while Supabase manages persistent storage, authentication, and row-level security.

The architecture is optimized for:

- Fast read-heavy operations
- Periodic background ingestion of RSS feeds
- Clean separation between ingestion layer and presentation layer

---

## 2. High-Level Architecture

Client (Browser)
↓
Next.js Frontend (React Server + Client Components)
↓
Next.js Server Layer (API Routes / Server Actions)
↓
Supabase (PostgreSQL + Auth + Storage)

Background Layer:
Scheduled Cron Job → RSS Fetcher → Parser → Database

---

## 3. Component Architecture

### 3.1 Frontend Layer (Next.js)

Responsibilities:

- Render personalized news feed
- Handle UI state
- Call server actions
- Display search results
- Manage client-side filtering

Rendering Strategy:

- Home feed: Server-side rendering (SSR)
- Category pages: Incremental Static Regeneration (ISR)
- Search: Server-side dynamic rendering

State Management:

- React state for UI interactions
- URL query params for filters

---

### 3.2 Backend Layer (Next.js Server)

Responsibilities:

- Secure database access
- Fetch filtered articles
- Handle bookmark mutations
- Execute feed ingestion logic

Patterns:

- Server Actions for mutations
- Route Handlers for data fetching
- Middleware for authentication guard

---

### 3.3 Database Layer (Supabase)

Database: PostgreSQL

Key Architectural Decisions:

- Normalize sources into a separate table
- Articles indexed by published\_at
- Unique constraint on article URL
- Use Row Level Security (RLS)

Indexes:

- articles(url) UNIQUE
- articles(published\_at DESC)
- articles(category)
- bookmarks(user\_id, article\_id)

---

## 4. RSS Ingestion Architecture

### 4.1 Ingestion Flow

1. Cron Trigger (Supabase Edge Function)
2. Fetch RSS feeds in parallel
3. Parse XML safely
4. Normalize fields
5. Deduplicate (URL hash check)
6. Insert new records
7. Log ingestion result

---

### 4.2 Feed Fetch Strategy

- Use Promise.all for parallel fetch
- Timeout after 5 seconds per feed
- Retry failed feeds (max 2 retries)
- Log failures in ingestion\_logs table

---

## 5. Authentication Architecture

Provider: Supabase Auth

Flow:

1. User logs in
2. Supabase issues JWT
3. JWT stored in secure HTTP-only cookies
4. Middleware validates session
5. RLS enforces row ownership

Security:

- Only owner can access bookmarks
- User preferences isolated per user

---

## 6. Data Flow

### 6.1 Article Read Flow

Browser → Next.js Server → Supabase → Response → Render

### 6.2 Bookmark Flow

Browser → Server Action → Supabase Insert → Revalidate Path

---

## 7. Search Architecture

Option 1: PostgreSQL Full-Text Search

- tsvector index on title + description
- Ranked search results

Option 2 (Future): External search engine (Meilisearch)

Current Recommendation:
Use PostgreSQL FTS with GIN index.

---

## 8. Caching Strategy

Layer 1: Database indexes
Layer 2: Next.js ISR caching (60–300 seconds)
Layer 3: HTTP cache headers

Revalidation:

- Trigger revalidatePath after ingestion
- Time-based revalidation for categories

---

## 9. Error Handling Architecture

- Graceful fallback if feed fails
- Show cached data
- Log ingestion errors
- Global error boundary in Next.js

---

## 10. Observability

Logging:

- Ingestion logs table
- Console logs (development)

Metrics (Optional Future):

- Fetch duration
- Article insert rate
- Failed feed count

---

## 11. Deployment Architecture

Frontend & Server:

- Hosted on Vercel

Database:

- Supabase managed PostgreSQL

Environment Variables:

- SUPABASE\_URL
- SUPABASE\_ANON\_KEY
- SUPABASE\_SERVICE\_ROLE\_KEY
- CRON\_SECRET

---

## 12. Scalability Considerations

- Designed for single-user but horizontally scalable
- RSS fetch parallelized
- Database indexes optimized for read-heavy loads
- Stateless server architecture

---

## 13. Future Architectural Extensions

- Edge Functions for ingestion
- AI summarization microservice
- Notification service (email or push)
- Multi-user role support

---

End of Technical Architecture Document.

