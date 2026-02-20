# Feed Prism — RSS Ingestion Pipeline

## How News Articles Are Fetched

### Overview

Feed Prism automatically fetches news from **~50 RSS/Atom feed sources** across 9 categories. The system uses a **batched ingestion pipeline** that processes sources in rotating groups to stay within serverless function time limits.

```
┌──────────────┐     every 3 min     ┌──────────────────┐
│  Supabase    │ ──────────────────► │  /api/ingest     │
│  pg_cron     │   HTTP GET          │  (Next.js API)   │
└──────────────┘                     └────────┬─────────┘
                                              │
                                     ┌────────▼─────────┐
                                     │  Batch Selector   │
                                     │  (10 sources/call)│
                                     └────────┬─────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          │                   │                   │
                   ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
                   │ Feed 1      │    │ Feed 2      │    │ Feed 3      │
                   │ (XML fetch) │    │ (XML fetch) │    │ (XML fetch) │
                   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
                          │                   │                   │
                   ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
                   │ XML Parser  │    │ XML Parser  │    │ XML Parser  │
                   │ + Sanitizer │    │ + Sanitizer │    │ + Sanitizer │
                   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
                          │                   │                   │
                          └───────────────────┼───────────────────┘
                                              │
                                     ┌────────▼─────────┐
                                     │  Batch UPSERT    │
                                     │  (per source)    │
                                     │  ON CONFLICT     │
                                     │  DO NOTHING      │
                                     └────────┬─────────┘
                                              │
                                     ┌────────▼─────────┐
                                     │  PostgreSQL      │
                                     │  (articles table)│
                                     └──────────────────┘
```

### Step-by-Step Process

#### 1. Cron Trigger

A Supabase `pg_cron` job fires every **3 minutes**, sending an HTTP GET request to `/api/ingest`. The endpoint is protected by a `CRON_SECRET` to prevent unauthorized access.

#### 2. Batch Selection

The system doesn't process all 50 sources at once. Instead:

- All active sources are fetched and sorted by ID
- They're divided into **batches of 10**
- A **batch index** (stored in `ingestion_logs`) determines which batch to process
- After processing, the index increments and wraps around

```
Call 1 → Batch 0 → Sources  1-10  (e.g., TechCrunch, Verge, Ars Technica...)
Call 2 → Batch 1 → Sources 11-20  (e.g., OpenAI, DeepMind, Anthropic...)
Call 3 → Batch 2 → Sources 21-30  (e.g., BleepingComputer, Krebs...)
Call 4 → Batch 3 → Sources 31-40  (e.g., Netflix Tech, Uber Eng...)
Call 5 → Batch 4 → Sources 41-50  (e.g., AWS Status, Cloudflare...)
Call 6 → Batch 0 → ♻️ Back to start
```

**Result:** Every source is refreshed every ~15 minutes, but each individual call only takes **3-5 seconds**.

#### 3. Feed Fetching & Parsing

For each source in the batch, the parser (`lib/rss/parser.js`):

1. **Fetches** the RSS/Atom XML via HTTP
2. **Parses** the XML using `fast-xml-parser`
3. **Normalizes** fields across different feed formats (RSS 2.0, Atom, RDF)
4. **Extracts** title, description, URL, author, publish date, and images
5. **Sanitizes** HTML content to strip scripts, styles, and dangerous tags (XSS prevention)
6. **Truncates** descriptions to 500 characters

Three sources are processed **in parallel** at a time to balance speed and network reliability.

#### 4. Deduplication & Insertion

This is the critical step — see the detailed section below.

#### 5. Logging

After each batch, results are logged to the `ingestion_logs` table:

- Which sources were processed
- How many articles were inserted vs. skipped
- Any errors encountered
- The next batch index for rotation

---

## How Only New Articles Are Added

### The Problem

RSS feeds contain a rolling window of articles (typically the last 20-50). Each time we fetch a feed, most articles are ones we've **already seen**. We must avoid inserting duplicates.

### The Solution: SHA-256 URL Hashing + Database Upsert

Every article's URL is treated as its **unique identity**. Here's the two-layer protection:

#### Layer 1: URL Hash Generation

```javascript
// Every article URL is converted to a deterministic SHA-256 hash
async function hashUrl(url) {
  const data = new TextEncoder().encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

**Why hash instead of storing the raw URL?**

- URLs can be very long (2000+ chars) — hashes are always 64 chars
- Hash comparisons are faster than string comparisons on long URLs
- The hash index is more compact and efficient

**Example:**

```
URL:  https://techcrunch.com/2024/01/15/openai-releases-gpt-5/
Hash: a3f7c2d1e8b94f6a...  (64-char hex string)
```

#### Layer 2: Database UPSERT with ON CONFLICT DO NOTHING

The `articles` table has a **unique constraint** on `url_hash`:

```sql
CREATE TABLE public.articles (
    ...
    url_hash TEXT NOT NULL,
    CONSTRAINT unique_url_hash UNIQUE(url_hash)
);
```

When inserting articles, we use Supabase's **upsert** with `ignoreDuplicates`:

```javascript
const { data: inserted } = await supabase
  .from("articles")
  .upsert(rows, {
    onConflict: "url_hash",
    ignoreDuplicates: true, // ← ON CONFLICT DO NOTHING
  })
  .select("id");
```

This translates to the SQL:

```sql
INSERT INTO articles (title, url, url_hash, ...)
VALUES
  ('Article 1', 'https://...', 'hash1', ...),
  ('Article 2', 'https://...', 'hash2', ...),
  ('Article 3', 'https://...', 'hash3', ...)
ON CONFLICT (url_hash) DO NOTHING
RETURNING id;
```

**What happens:**

- If `hash1` already exists → **silently skipped** (no error, no update)
- If `hash2` is new → **inserted**
- If `hash3` already exists → **silently skipped**
- The `RETURNING id` clause returns only the IDs of **newly inserted** rows

This means:

- ✅ New articles are inserted
- ✅ Existing articles are skipped (not duplicated)
- ✅ No separate "check if exists" query needed
- ✅ All articles from one feed are processed in **a single database query**

---

## Deduplication Detection — Complete Flow

```
Feed returns 30 articles
        │
        ▼
┌─────────────────────────────┐
│  For each article:          │
│  1. Normalize URL           │
│     (lowercase + trim)      │
│  2. SHA-256 hash the URL    │
│  3. Build insert row        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Batch UPSERT all 30 rows   │
│  ON CONFLICT (url_hash)     │
│  DO NOTHING                 │
│                             │
│  Database checks each hash: │
│  • hash exists? → SKIP      │
│  • hash new?    → INSERT    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Result:                    │
│  • 3 new articles inserted  │
│  • 27 existing skipped      │
│  • 0 duplicates created     │
└─────────────────────────────┘
```

### Edge Cases Handled

| Scenario                                        | How It's Handled                                             |
| ----------------------------------------------- | ------------------------------------------------------------ |
| Same URL appears in multiple feeds              | Same hash → only first insert succeeds, rest are skipped     |
| URL has trailing slash / no trailing slash      | URL is lowercased and trimmed before hashing                 |
| Feed returns the same article twice             | Same hash in the same upsert batch → DB handles it           |
| Article URL changes but content is same         | Treated as a new article (URL is the unique identifier)      |
| Feed is temporarily down                        | Error is logged, retried once, then skipped until next cycle |
| Hash collision (two different URLs → same hash) | Astronomically unlikely with SHA-256 (1 in 2^128)            |

### Performance Comparison

| Approach                       | Queries per Feed             | Time for 10 Feeds |
| ------------------------------ | ---------------------------- | ----------------- |
| ❌ SELECT per article + INSERT | 60 queries (2 × 30 articles) | ~40 seconds       |
| ✅ Batch UPSERT (current)      | 1 query (all 30 articles)    | ~3-5 seconds      |

---

## Files Involved

| File                      | Role                                          |
| ------------------------- | --------------------------------------------- |
| `lib/rss/parser.js`       | Fetches and parses RSS/Atom XML feeds         |
| `lib/rss/ingest.js`       | Orchestrates batching, dedup, upsert, logging |
| `lib/sanitize.js`         | Strips HTML tags and dangerous content        |
| `lib/supabase/admin.js`   | Service-role Supabase client (bypasses RLS)   |
| `app/api/ingest/route.js` | HTTP endpoint triggered by cron               |
| `scripts/setup-cron.sql`  | Supabase pg_cron schedule setup               |
| `scripts/local-cron.ps1`  | Local development cron simulator              |
