import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { articlesQuerySchema } from '@/lib/validation';

/**
 * GET /api/articles
 * Fetch articles with filtering, pagination, and optional search
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = articlesQuerySchema.parse({
      category: searchParams.get('category') || undefined,
      source: searchParams.get('source') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      search: searchParams.get('search') || undefined,
    });

    const supabase = await createClient();
    const { page, limit, category, source, search } = params;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('articles')
      .select('*, sources!inner(name, rss_url)', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (source) {
      query = query.eq('source_id', source);
    }
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Order and paginate
    query = query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Articles fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
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
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
