import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/sources
 * Fetch all active RSS sources, grouped by category
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category
    const grouped = (data || []).reduce((acc, source) => {
      if (!acc[source.category]) acc[source.category] = [];
      acc[source.category].push(source);
      return acc;
    }, {});

    return NextResponse.json({
      data: data || [],
      grouped,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
