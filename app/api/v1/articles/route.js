import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Schema allows comma-separated strings for multiple selections
const publicApiQuerySchema = z.object({
  categories: z.string().optional(),
  sources: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/v1/articles
 * Public API — requires x-api-key header
 * Supports multi-select via comma-separated values:
 *   ?categories=Technology,Security&sources=uuid1,uuid2
 */
export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { status: 'error', error: 'Missing x-api-key header. Include your API key in the request headers.' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS for key validation
    const supabase = createAdminClient();

    // 1. Authenticate API Key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, status')
      .eq('api_key', apiKey)
      .single();

    if (keyError || !keyData || keyData.status !== 'active') {
      return NextResponse.json(
        { status: 'error', error: 'Invalid or revoked API key.' },
        { status: 403 }
      );
    }

    // Update last_used_at timestamp (fire-and-forget)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)
      .then(() => {});

    // 2. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const params = publicApiQuerySchema.parse(
      Object.fromEntries(searchParams)
    );

    const MIN_SUMMARY_WORDS = 20;

    // 3. Build Query — include description (exposed as "summary"), exclude null/empty at DB level
    let query = supabase
      .from('articles')
      .select('id, title, description, url, published_at, category, source_id, sources(name)', { count: 'exact' })
      .not('description', 'is', null)
      .neq('description', '');

    // 4. Apply Multi-Select Filters
    if (params.categories) {
      const categoryArray = params.categories.split(',').map(c => c.trim()).filter(Boolean);
      if (categoryArray.length > 0) {
        query = query.in('category', categoryArray);
      }
    }

    if (params.sources) {
      const sourceArray = params.sources.split(',').map(s => s.trim()).filter(Boolean);
      if (sourceArray.length > 0) {
        query = query.in('source_id', sourceArray);
      }
    }

    // 5. Over-fetch to account for post-filter word-count enforcement.
    const overFetchMultiplier = 4;
    const overFetchLimit = params.limit * overFetchMultiplier;
    const overFetchOffset = (params.page - 1) * params.limit * overFetchMultiplier;

    query = query
      .order('published_at', { ascending: false })
      .range(overFetchOffset, overFetchOffset + overFetchLimit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Public API articles error:', error);
      return NextResponse.json(
        { status: 'error', error: 'Failed to fetch articles.' },
        { status: 500 }
      );
    }

    // 6. Enforce minimum summary word count (undisputable filter)
    const qualified = (data || []).filter(article => {
      const wordCount = article.description.trim().split(/\s+/).length;
      return wordCount >= MIN_SUMMARY_WORDS;
    });

    // 7. Paginate and remap description → body for public API
    const pageSlice = qualified.slice(0, params.limit).map(({ description, ...rest }) => ({
      ...rest,
      body: description,
    }));

    // Estimate the true filtered total from the ratio of qualified / fetched
    const fetchedCount = (data || []).length;
    const qualifiedRatio = fetchedCount > 0 ? qualified.length / fetchedCount : 0;
    const estimatedTotal = Math.round((count || 0) * qualifiedRatio);

    return NextResponse.json({
      status: 'success',
      data: pageSlice,
      meta: {
        page: params.page,
        limit: params.limit,
        total: estimatedTotal,
        totalPages: Math.ceil(estimatedTotal / params.limit),
        filter: `summary >= ${MIN_SUMMARY_WORDS} words`,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { status: 'error', error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Public API unexpected error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
