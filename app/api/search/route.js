import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchQuerySchema } from '@/lib/validation';

function applyFilters(query, { category, source, from, to }) {
  let filtered = query;

  if (category) filtered = filtered.eq('category', category);
  if (source) filtered = filtered.eq('source_id', source);
  if (from) filtered = filtered.gte('published_at', from);
  if (to) filtered = filtered.lte('published_at', to);

  return filtered;
}

function sanitizeForIlike(raw) {
  return raw.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * GET /api/search
 * Full-text search on articles with ILIKE fallback.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchQuerySchema.parse({
      q: searchParams.get('q'),
      category: searchParams.get('category') || undefined,
      source: searchParams.get('source') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const supabase = await createClient();
    const { q, category, source, from, to, page, limit } = params;
    const offset = (page - 1) * limit;

    const baseQuery = supabase
      .from('articles')
      .select('*, sources!inner(name)', { count: 'exact' });

    let query = applyFilters(baseQuery, { category, source, from, to })
      .textSearch('search_vector', q, {
        type: 'websearch',
        config: 'english',
      })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let { data, error, count } = await query;
    let mode = 'fts';

    const shouldFallback =
      !!error ||
      (!data?.length && q.trim().length >= 2);

    if (shouldFallback) {
      const safeQ = sanitizeForIlike(q);
      if (safeQ) {
        const ilikePattern = `%${safeQ}%`;
        const fallbackBase = supabase
          .from('articles')
          .select('*, sources!inner(name)', { count: 'exact' });

        const fallbackQuery = applyFilters(fallbackBase, { category, source, from, to })
          .or(`title.ilike.${ilikePattern},description.ilike.${ilikePattern}`)
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const fallbackResult = await fallbackQuery;
        if (!fallbackResult.error) {
          data = fallbackResult.data;
          count = fallbackResult.count;
          error = null;
          mode = 'ilike';
        }
      }
    }

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      query: q,
      mode,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
