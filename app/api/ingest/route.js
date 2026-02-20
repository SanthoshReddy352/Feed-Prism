import { NextResponse } from 'next/server';
import { runBatchedIngestion, runFullIngestion } from '@/lib/rss/ingest';

/**
 * GET /api/ingest
 * Cron-triggered endpoint to run RSS feed ingestion.
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * Query Parameters:
 *   ?secret=YOUR_CRON_SECRET  — required (unless no CRON_SECRET env var is set)
 *   ?mode=full                — process ALL sources at once (default: batched)
 *   ?mode=batch               — process one batch of ~10 sources (default)
 *
 * Headers:
 *   Authorization: Bearer YOUR_CRON_SECRET
 *
 * Examples:
 *   Cron (batched):  GET /api/ingest?secret=xxx
 *   Manual (full):   GET /api/ingest?secret=xxx&mode=full
 */
export async function GET(request) {
  try {
    // Verify authorization
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secretParam !== cronSecret && bearerToken !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine mode
    const mode = searchParams.get('mode') || 'batch';

    let result;
    if (mode === 'full') {
      console.log('[Ingest] Starting FULL ingestion (all sources)...');
      result = await runFullIngestion();
    } else {
      console.log('[Ingest] Starting BATCHED ingestion...');
      result = await runBatchedIngestion();
    }

    if (result.updates?.length > 0) {
      for (const update of result.updates) {
        console.log(`[Ingest] Update: [${update.category}] ${update.source} (${update.count})`);
      }
    }

    console.log(`[Ingest] Complete: ${result.articles_inserted} inserted, ${result.errors} errors, ${result.duration_ms}ms`);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Ingest] Fatal error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Allow longer execution for full mode
export const maxDuration = 60;
