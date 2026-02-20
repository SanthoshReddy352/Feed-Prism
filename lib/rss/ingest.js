
import { createAdminClient } from '@/lib/supabase/admin';
import { parseFeed } from '@/lib/rss/parser';



/**
 * RSS Ingestion Service — Weighted Batch Mode
 *
 * FEATURES:
 * 1. Weighted Batching: Heavy sources (weight=10) get their own batch.
 * 2. Pure RSS: Fetches content directly from feed (no external scraping).
 * 3. Performance: Uses batch upsert (ON CONFLICT DO NOTHING).
 */

const TARGET_BATCH_WEIGHT = 10; // Total weight per cron call

/**
 * Generate a SHA-256 hash for URL deduplication
 */
async function hashUrl(url) {
  const encoder = new TextEncoder();
  const data = encoder.encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
    // 1. Parse feed
    const articles = await parseFeed(source.rss_url);

    if (!articles.length) {
      result.error = 'No articles found in feed';
      return result;
    }

    // 2. Prepare articles with hashes
    const rows = [];
    
    // Process items efficiently without scraping restrictions
    for (const article of articles) {
      if (!article.url) continue;

      const urlHash = await hashUrl(article.url); 

      // Use content directly from the feed (parser already attempts to get content:encoded)
      // If content is empty, use description or title as fallback
      let content = article.content || article.description || '';
      
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
        published_at: article.published_at || new Date().toISOString(),
      });
    }

    if (!rows.length) {
      result.error = 'No valid articles after processing';
      return result;
    }

    // 3. Batch upsert
    const { data: inserted, error: upsertError } = await supabase
      .from('articles')
      .upsert(rows, {
        onConflict: 'url_hash',
        ignoreDuplicates: true,
      })
      .select('id');

    if (upsertError) {
      result.error = upsertError.message;
      return result;
    }

    result.inserted = inserted?.length || 0;
    result.skipped = rows.length - result.inserted;

    return result;
  } catch (fetchError) {
    result.error = fetchError.message;
    return result;
  }
}


/**
 * Process a list of sources
 */
import pLimit from 'p-limit';

async function processSources(sources, supabase) {
  const limit = pLimit(5); // Process 5 feeds concurrently
  
  const promises = sources.map(source => 
    limit(() => processSource(source, supabase))
  );

  return Promise.all(promises);
}


/**
 * Get/Set batch state
 */
async function getBatchIndex(supabase) {
  const { data } = await supabase
    .from('ingestion_logs')
    .select('message')
    .eq('status', 'batch_state') // Reverted to match DB constraint
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data?.message) {
    const parsed = parseInt(data.message, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

async function saveBatchIndex(supabase, nextIndex) {
  await supabase.from('ingestion_logs').insert({
    status: 'batch_state',
    message: String(nextIndex),
    articles_count: 0,
  });
}

async function logResults(supabase, results) {
  const entries = results.map((r) => ({
    source_id: r.source_id,
    status: r.error ? 'error' : 'success',
    articles_count: r.inserted,
    message: r.error || `+${r.inserted} new`,
  }));

  // async log
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
 * Weighted Batched Ingestion
 */
export async function runBatchedIngestion() {
  const supabase = createAdminClient();
  const startTime = Date.now();

  // 1. Fetch ALL active sources ordered by ID (deterministic)
  const { data: allSources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (sourcesError) throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
  if (!allSources?.length) return { message: 'No active sources', batch: 0 };

  // 2. Generate Batches
  const batches = [];
  let currentBatch = [];
  let currentWeight = 0;

  for (const source of allSources) {
    const weight = source.batch_weight || 1;
    
    // If adding this source exceeds target weight and batch isn't empty, start new batch
    // Exception: If a single source > target weight, it goes in its own batch
    if (currentWeight + weight > TARGET_BATCH_WEIGHT && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentWeight = 0;
    }
    
    currentBatch.push(source);
    currentWeight += weight;
    
    // If strict match or exceeded, close batch
    if (currentWeight >= TARGET_BATCH_WEIGHT) {
      batches.push(currentBatch);
      currentBatch = [];
      currentWeight = 0;
    }
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  // 3. Select Batch
  const currentBatchIndex = await getBatchIndex(supabase);
  const batchIndex = currentBatchIndex % batches.length;
  const targetBatch = batches[batchIndex];

  console.log(`[Ingest] Batch ${batchIndex + 1}/${batches.length}: ${targetBatch.map(s => `${s.name} (w${s.batch_weight || 1})`).join(', ')}`);

  // 4. Process
  const results = await processSources(targetBatch, supabase);

  // 5. Rotate
  await saveBatchIndex(supabase, (batchIndex + 1) % batches.length);
  await logResults(supabase, results);

  return buildSummary('weighted-batch', results, targetBatch, startTime, {
    batch: `${batchIndex + 1}/${batches.length}`,
    sources: targetBatch.map(s => s.name),
  });
}

export async function runFullIngestion() {
  const supabase = createAdminClient();
  const startTime = Date.now();
  const { data: sources } = await supabase.from('sources').select('*').eq('is_active', true);
  
  if (!sources?.length) return { message: 'No sources' };
  
  console.log(`[Ingest] Full mode: ${sources.length} sources`);
  const results = await processSources(sources, supabase);
  await logResults(supabase, results);
  return buildSummary('full', results, sources, startTime);
}
