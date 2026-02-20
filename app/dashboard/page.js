import { createClient } from '@/lib/supabase/server';
import { getBookmarkedArticleIds } from '@/app/actions/bookmarks';
import { getPreferences } from '@/app/actions/preferences';
import FeedClient from './FeedClient';

export default async function DashboardPage({ searchParams }) {
  const supabase = await createClient();
  const page = Number((await searchParams)?.page) || 1;
  const itemsPerPage = 21;

  // Get user preferences
  const userPreferences = await getPreferences();
  const bookmarkedIds = await getBookmarkedArticleIds();

  // Base query
  let query = supabase
    .from('articles')
    .select('*, sources!inner(name)', { count: 'exact' })
    .lte('published_at', new Date().toISOString());

  // Apply filters
  if (userPreferences?.preferred_categories?.length) {
    query = query.in('category', userPreferences.preferred_categories);
  }
  
  if (userPreferences?.preferred_sources?.length) {
    query = query.in('source_id', userPreferences.preferred_sources);
  }

  // Calculate range
  // Page 1: Featured (0-2), List (3-20)
  // Page 2+: List ((page-1)*21 - (page*21)-1)
  
  let featuredArticles = [];
  let articles = [];
  let count = 0;

  try {
    if (page === 1) {
      // Fetch Featured (Top 3)
      const { data: featured } = await query
        .order('published_at', { ascending: false })
        .range(0, 2);
      
      featuredArticles = featured || [];

      // Fetch List (Next 18)
      const { data: list, count: totalCount } = await query
        .order('published_at', { ascending: false })
        .range(3, 20);
      
      articles = list || [];
      count = totalCount;
    } else {
      // Fetch List (Standard Page)
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: list, count: totalCount } = await query
        .order('published_at', { ascending: false })
        .range(from, to);
        
      articles = list || [];
      count = totalCount;
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }

  return (
    <FeedClient
      initialArticles={articles}
      featuredArticles={featuredArticles}
      initialPagination={{
        page,
        limit: itemsPerPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage),
      }}
      bookmarkedIds={bookmarkedIds}
      viewMode={userPreferences?.view_mode || 'detailed'}
    />
  );
}
