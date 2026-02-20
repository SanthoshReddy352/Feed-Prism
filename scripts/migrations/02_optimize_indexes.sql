-- Optimizing indexes for common query patterns

-- 1. Index for fetching active sources (used in ingestion)
CREATE INDEX IF NOT EXISTS idx_sources_is_active ON public.sources(is_active);

-- 2. Index for fetching articles by source (dashboard/source/[id])
CREATE INDEX IF NOT EXISTS idx_articles_source_published 
ON public.articles(source_id, published_at DESC);

-- 3. Index for fetching articles by category (dashboard/category/[slug])
-- Note: existing idx_articles_category is good, but compound might be better if we always sort by date
DROP INDEX IF EXISTS idx_articles_category;
CREATE INDEX IF NOT EXISTS idx_articles_category_published 
ON public.articles(category, published_at DESC);

-- 4. Index for user feed (all articles sorted by date)
-- Note: idx_articles_published_at ALREADY EXISTS in schema.sql, so we are good there.
