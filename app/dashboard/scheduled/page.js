import { createClient } from '@/lib/supabase/server';
import { getBookmarkedArticleIds } from '@/app/actions/bookmarks';
import InteractiveArticleFeed from '../components/InteractiveArticleFeed';
import styles from '../category/[slug]/page.module.css'; // Reusing category styles

export const metadata = {
  title: 'Scheduled Articles — Feed Prism',
  description: 'Upcoming scheduled articles on Feed Prism.',
};

export default async function ScheduledPage() {
  const supabase = await createClient();
  const bookmarkedIds = await getBookmarkedArticleIds();

  // Fetch articles scheduled for the future
  const { data: articles, count } = await supabase
    .from('articles')
    .select('*, sources!inner(name)', { count: 'exact' })
    .gt('published_at', new Date().toISOString())
    .order('published_at', { ascending: true }) // Show soonest first
    .range(0, 19);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📅 Scheduled</h1>
        <p className={styles.pageSubtitle}>
          {count ? `${count.toLocaleString()} upcoming articles` : 'No scheduled articles found'}
        </p>
      </div>

      <InteractiveArticleFeed
        articles={articles || []}
        pagination={{
          page: 1,
          limit: 20,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / 20),
        }}
        bookmarkedIds={bookmarkedIds}
        viewMode="detailed"
      />
    </div>
  );
}
