import { createClient } from '@/lib/supabase/server';
import InteractiveArticleFeed from '../components/InteractiveArticleFeed';
import styles from './page.module.css';

export const metadata = {
  title: 'Bookmarks — Feed Prism',
  description: 'Your saved articles.',
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('article_id, created_at, articles(*, sources(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const articles = (bookmarks || []).map((b) => ({
    ...b.articles,
    bookmarked_at: b.created_at,
  }));
  const bookmarkedIds = articles.map((a) => a.id);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>⭐ Bookmarks</h1>
        <p className={styles.pageSubtitle}>
          {articles.length > 0
            ? `${articles.length} saved article${articles.length !== 1 ? 's' : ''}`
            : 'No bookmarks yet — save articles from your feed'}
        </p>
      </div>

      <InteractiveArticleFeed
        articles={articles}
        pagination={{ page: 1, limit: 100, total: articles.length, totalPages: 1 }}
        bookmarkedIds={bookmarkedIds}
        viewMode="detailed"
      />
    </div>
  );
}
