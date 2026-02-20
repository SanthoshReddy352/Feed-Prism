import { createClient } from '@/lib/supabase/server';
import { getBookmarkedArticleIds } from '@/app/actions/bookmarks';
import ArticleList from '../../components/ArticleList';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: source } = await supabase
    .from('sources')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: `${source?.name || 'Source'} — Feed Prism`,
    description: `Browse articles from ${source?.name || 'this source'}.`,
  };
}

export default async function SourcePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const bookmarkedIds = await getBookmarkedArticleIds();

  // Get source details
  const { data: source } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .single();

  // Get articles from this source
  const { data: articles, count } = await supabase
    .from('articles')
    .select('*, sources!inner(name)', { count: 'exact' })
    .eq('source_id', id)
    .order('published_at', { ascending: false })
    .range(0, 19);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📰 {source?.name || 'Source'}</h1>
        <p className={styles.pageSubtitle}>
          {source?.category && <span className={styles.categoryBadge}>{source.category}</span>}
          {count ? ` ${count.toLocaleString()} articles` : ' No articles yet'}
        </p>
      </div>

      <ArticleList
        initialArticles={articles || []}
        initialPagination={{
          page: 1,
          limit: 20,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / 20),
        }}
        bookmarkedIds={bookmarkedIds}
        viewMode="detailed"
        queryParams={{ source: id }}
      />
    </div>
  );
}
