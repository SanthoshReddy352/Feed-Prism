
import pLimit from 'p-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAndParseFeed } from '@/lib/rss/parser';
import { hashUrl } from '@/lib/rss/url-canonical';

/**
 * RSS Ingestion Service — Recency-Based Rotation
 *
 * Each cron run fetches the N least-recently-fetched active sources
 * (ordered by last_fetched_at). This self-balances coverage without any
 * fragile counter, and every source is refreshed on a predictable cycle.
 *
 * - Conditional GET (ETag / Last-Modified) skips feeds that haven't changed.
 * - Dedup is enforced by the DB: a trigger computes dedup_hash
 *   (source + normalized title + publish time) and fp_ingest_articles() inserts
 *   with ON CONFLICT DO NOTHING, so rotating-URL re-publishes are ignored.
 * - Per-source health (last_status, consecutive_failures) is tracked so dead
 *   feeds are easy to spot and can be backed off.
 */

const SOURCES_PER_RUN = 12;  // feeds fetched per cron invocation
const FETCH_CONCURRENCY = 5;  // parallel feed fetches

/**
 * Best-effort update of per-source health/conditional-GET metadata.
 * Columns are added by scripts/migrations/04_fetching_and_health.sql — if that
 * migration hasn't been run yet, this silently no-ops so ingestion still works.
 */
async function updateSourceHealth(supabase, sourceId, patch) {
  const { error } = await supabase.from('sources').update(patch).eq('id', sourceId);
  if (error) {
    // Likely the new columns don't exist yet; don't fail the run over it.
    console.warn(`[Ingest] Could not update source health for ${sourceId}: ${error.message}`);
  }
}

/**
 * Process a single source feed
 */
async function processSource(source, supabase) {
  const result = {
    source_id: source.id,
    source_name: source.name,
    category: source.category,
    inserted: 0,
    skipped: 0,
    error: null,
  };

  try {
    // 1. Fetch + parse feed with conditional GET (skips unchanged feeds).
    const { articles, notModified, etag, lastModified } = await fetchAndParseFeed(source.rss_url, {
      etag: source.etag || null,
      lastModified: source.last_modified || null,
    });

    if (notModified) {
      await updateSourceHealth(supabase, source.id, {
        last_fetched_at: new Date().toISOString(),
        last_status: 'not_modified',
        consecutive_failures: 0,
      });
      return result; // nothing changed since last fetch
    }

    if (!articles.length) {
      result.error = 'No articles found in feed';
      await updateSourceHealth(supabase, source.id, {
        last_fetched_at: new Date().toISOString(),
        last_status: 'empty',
        consecutive_failures: (source.consecutive_failures || 0) + 1,
      });
      return result;
    }

    // 2. Prepare rows with canonical-URL hashes, dropping only EXACT repeats
    //    within this single feed (some feeds list the same item twice, or with
    //    url+guid variants). Cross-fetch + title/time dedup is handled by the DB
    //    trigger, so we don't risk dropping distinct same-title items here.
    const rows = [];
    const seenHash = new Set();

    for (const article of articles) {
      if (!article.url) continue;

      const urlHash = await hashUrl(article.url);
      if (seenHash.has(urlHash)) continue;
      seenHash.add(urlHash);

      // Use feed content; fall back to description/title.
      const content = article.content || article.description || '';

      rows.push({
        source_id: source.id,
        title: article.title,
        description: article.description,
        content: content,
        image_url: article.image_url || '',
        author: article.author || '',
        category: source.category,
        url: article.url,
        url_hash: urlHash,
        // Only fall back to "now" when the feed truly has no date, so genuinely
        // dated articles keep their real ordering.
        published_at: article.published_at || new Date().toISOString(),
      });
    }

    if (!rows.length) {
      result.error = 'No valid articles after processing';
      return result;
    }

    // 3. Insert via RPC. The DB computes dedup_hash (source + normalized title
    //    + publish time) in a trigger and ignores ANY unique conflict, so
    //    Google-News-style rotating URLs and exact re-fetches are both skipped
    //    without erroring the batch. Returns the number of rows actually inserted.
    const { data: insertedCount, error: upsertError } = await supabase
      .rpc('fp_ingest_articles', { payload: rows });

    if (upsertError) {
      result.error = upsertError.message;
      await updateSourceHealth(supabase, source.id, {
        last_fetched_at: new Date().toISOString(),
        last_status: 'error',
        consecutive_failures: (source.consecutive_failures || 0) + 1,
      });
      return result;
    }

    result.inserted = insertedCount || 0;
    result.skipped = rows.length - result.inserted;

    await updateSourceHealth(supabase, source.id, {
      last_fetched_at: new Date().toISOString(),
      last_status: 'success',
      consecutive_failures: 0,
      etag: etag || source.etag || null,
      last_modified: lastModified || source.last_modified || null,
    });

    return result;
  } catch (fetchError) {
    result.error = fetchError.message;
    await updateSourceHealth(supabase, source.id, {
      last_fetched_at: new Date().toISOString(),
      last_status: 'error',
      consecutive_failures: (source.consecutive_failures || 0) + 1,
    });
    return result;
  }
}


/**
 * Process a list of sources with bounded concurrency.
 */
async function processSources(sources, supabase) {
  const limit = pLimit(FETCH_CONCURRENCY);
  return Promise.all(sources.map((source) => limit(() => processSource(source, supabase))));
}

async function logResults(supabase, results) {
  const entries = results.map((r) => ({
    source_id: r.source_id,
    status: r.error ? 'error' : 'success',
    articles_count: r.inserted,
    message: r.error || `+${r.inserted} new`,
  }));

  // async log (fire and forget)
  supabase.from('ingestion_logs').insert(entries).then(() => {});
}

function buildSummary(mode, results, sources, startTime, extra = {}) {
  const updates = results
    .filter((r) => r.inserted > 0)
    .map((r) => ({
      source: r.source_name,
      category: r.category,
      count: r.inserted,
    }));

  return {
    mode,
    feeds_processed: sources.length,
    articles_inserted: results.reduce((sum, r) => sum + r.inserted, 0),
    articles_skipped: results.reduce((sum, r) => sum + r.skipped, 0),
    errors: results.filter((r) => r.error).length,
    duration_ms: Date.now() - startTime,
    updates,
    ...extra,
  };
}

/**
 * Recency-based rotation: fetch the N least-recently-fetched active sources.
 * `last_fetched_at NULLS FIRST` means brand-new sources are picked up immediately.
 */
export async function runBatchedIngestion() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('last_fetched_at', { ascending: true, nullsFirst: true })
    .order('id', { ascending: true })
    .limit(SOURCES_PER_RUN);

  if (error) throw new Error(`Failed to fetch sources: ${error.message}`);
  if (!sources?.length) return { message: 'No active sources' };

  console.log(`[Ingest] Rotation: ${sources.map((s) => s.name).join(', ')}`);

  const results = await processSources(sources, supabase);
  await logResults(supabase, results);

  return buildSummary('rotation', results, sources, startTime, {
    sources: sources.map((s) => s.name),
  });
}

/**
 * Full ingestion: refresh every active source in one run (manual / cold-start).
 */
export async function runFullIngestion() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (!sources?.length) return { message: 'No active sources' };

  console.log(`[Ingest] Full mode: ${sources.length} sources`);
  const results = await processSources(sources, supabase);
  await logResults(supabase, results);
  return buildSummary('full', results, sources, startTime);
}
