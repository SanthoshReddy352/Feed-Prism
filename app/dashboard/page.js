import { createClient } from '@/lib/supabase/server';
import { getBookmarkedArticleIds } from '@/app/actions/bookmarks';
import { getPreferences } from '@/app/actions/preferences';
import FeedClient from './FeedClient';

export default async function DashboardPage({ searchParams }) {
  const supabase = await createClient();
  const page = Number((await searchParams)?.page) || 1;
  const itemsPerPage = 21;

  // Fetch preferences and bookmarks in parallel
  const [userPreferences, bookmarkedIds] = await Promise.all([
    getPreferences(),
    getBookmarkedArticleIds(),
  ]);

  // Base query for articles
  const buildQuery = () => {
    let q = supabase
      .from('articles')
      .select('*, sources!inner(name)', { count: 'exact' })
      .lte('published_at', new Date().toISOString());

    if (userPreferences?.preferred_categories?.length) {
      q = q.in('category', userPreferences.preferred_categories);
    }
    
    if (userPreferences?.preferred_sources?.length) {
      q = q.in('source_id', userPreferences.preferred_sources);
    }

    return q.order('published_at', { ascending: false });
  };

  let featuredArticles = [];
  let articles = [];
  let count = 0;

  try {
    if (page === 1) {
      // Fetch Featured and First Page articles in parallel
      const [featuredRes, listRes] = await Promise.all([
        buildQuery().range(0, 2),
        buildQuery().range(3, 20)
      ]);
      
      featuredArticles = featuredRes.data || [];
      articles = listRes.data || [];
      count = listRes.count || 0;
    } else {
      // Fetch List (Next Pages)
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: list, count: totalCount } = await buildQuery().range(from, to);
        
      articles = list || [];
      count = totalCount || 0;
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
        total: count,
        totalPages: Math.ceil(count / itemsPerPage),
      }}
      bookmarkedIds={bookmarkedIds}
      viewMode={userPreferences?.view_mode || 'detailed'}
    />
  );
}
