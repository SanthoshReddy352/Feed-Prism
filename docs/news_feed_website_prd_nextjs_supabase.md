# Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Product Name
Personal News Dashboard

### 1.2 Product Vision
Build a high-quality personal news aggregation website that collects, processes, and displays news from multiple reliable sources (technology, global events, outbreaks, major companies like Google, Meta, OpenAI, etc.) in a clean, fast, and customizable interface.

### 1.3 Target User
Single-user (personal use). Not intended for commercial distribution.

### 1.4 Core Objectives
- Aggregate news from RSS feeds and APIs.
- Categorize and filter news by topic and source.
- Store and index articles efficiently.
- Provide fast, searchable, and customizable UI.
- Support bookmarking and read/unread tracking.

---

## 2. Technology Stack

### 2.1 Frontend
- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- Rendering: Hybrid (SSR + ISR where needed)

### 2.2 Backend
- Next.js API routes / Server Actions
- Supabase (PostgreSQL + Auth + Storage)

### 2.3 Database
- Supabase PostgreSQL

### 2.4 Hosting
- Vercel (recommended)
- Supabase (managed backend)

---

## 3. Functional Requirements

### 3.1 News Aggregation

#### 3.1.1 RSS Feed Integration
System must:
- Fetch articles from configured RSS feeds.
- Parse XML safely.
- Normalize fields (title, description, author, date, image, source, category, url).
- Deduplicate articles based on URL hash.

#### 3.1.2 API-based Sources
System must:
- Support integration with public news APIs (optional).
- Handle API rate limits.

#### 3.1.3 Scheduled Fetching
- Background job every 15–30 minutes.
- Store only new articles.

---

### 3.2 Categories

System must support:
- Technology
- AI & ML
- Global News
- Outbreaks / Health Alerts
- Company News (Google, Meta, OpenAI, etc.)
- Startups
- Security & Cybersecurity

Each article must belong to at least one category.

---

### 3.3 User Features

#### 3.3.1 Authentication
- Email + Password via Supabase Auth.
- Optional: GitHub login.

#### 3.3.2 Personalization
- Select preferred categories.
- Select preferred sources.
- Toggle compact / detailed view.

#### 3.3.3 Article Interaction
- Mark as read/unread.
- Bookmark articles.
- Open original source link.

#### 3.3.4 Search
- Full-text search on title + description.
- Filter by category.
- Filter by source.
- Filter by date.

---

### 3.4 Dashboard UI

Pages required:

1. Home (Personalized Feed)
2. Category Page
3. Source Page
4. Bookmarks Page
5. Search Page
6. Settings Page

UI Requirements:
- Responsive design.
- Fast loading (<1.5s initial load).
- Infinite scroll or pagination.

---

## 4. Database Schema (Supabase)

### 4.1 Tables

users
- id (uuid)
- email
- created_at

sources
- id
- name
- rss_url
- category
- is_active

articles
- id
- title
- description
- content
- image_url
- source_id (fk)
- category
- published_at
- url (unique)
- created_at

bookmarks
- id
- user_id (fk)
- article_id (fk)
- created_at

user_preferences
- user_id (fk)
- preferred_categories (array)
- preferred_sources (array)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Feed fetch under 5 seconds.
- DB indexed on url, category, published_at.
- Pagination limit 20–30 articles.

### 5.2 Security
- Row-level security in Supabase.
- Sanitize HTML content.
- Prevent XSS.

### 5.3 Scalability
- Designed for single user but scalable.
- Use ISR caching.

### 5.4 Reliability
- Retry mechanism for failed feed fetch.
- Logging system for fetch errors.

---

## 6. Data Pipeline Flow

1. Cron job triggers feed fetch.
2. RSS fetched.
3. XML parsed.
4. Data normalized.
5. Deduplication check.
6. Insert into database.
7. Indexed for search.
8. Served via Next.js API.

---

## 7. Future Enhancements

- AI-based summarization (OpenAI integration).
- Trend detection.
- Email digest.
- Push notifications.
- Sentiment analysis.
- Dark mode.

---

## 8. Success Metrics

- Articles updated automatically without manual refresh.
- Search results under 500ms.
- Zero duplicate entries.
- Clean, distraction-free reading experience.

---

## 9. Development Phases

Phase 1: Basic RSS ingestion + Display.
Phase 2: Authentication + Preferences.
Phase 3: Search + Filters.
Phase 4: Performance optimization.
Phase 5: AI features.

---

## 10. Constraints

- Personal usage only.
- Must respect RSS provider terms.
- API rate limits must not be exceeded.

---

End of Document.

