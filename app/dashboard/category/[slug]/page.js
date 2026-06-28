import { createClient } from '@/lib/supabase/server';
import { getBookmarkedArticleIds } from '@/app/actions/bookmarks';
import CategoryFeed from './CategoryFeed';
import styles from './page.module.css';

// Map URL slugs back to category names
const SLUG_TO_CATEGORY = {
  'technology': 'Technology',
  'ai---ml': 'AI & ML',
  'ai-ml': 'AI & ML',
  'global-news': 'Global News',
  'outbreaks---health': 'Outbreaks & Health',
  'outbreaks-health': 'Outbreaks & Health',
  'company-news': 'Company News',
  'cloud---infrastructure': 'Cloud & Infrastructure',
  'cloud-infrastructure': 'Cloud & Infrastructure',
  'developer---engineering': 'Developer & Engineering',
  'developer-engineering': 'Developer & Engineering',
  'startups': 'Startups',
  'security': 'Security',
  'ai-tools': 'AI Tools',
  'business': 'Business',
  'stocks---trading': 'Stocks & Trading',
  'stocks-trading': 'Stocks & Trading',
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = SLUG_TO_CATEGORY[slug] || slug;
  return {
    title: `${category} — Feed Prism`,
    description: `Browse ${category} articles on Feed Prism.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const category = SLUG_TO_CATEGORY[slug] || slug;

  const supabase = await createClient();
  const bookmarkedIds = await getBookmarkedArticleIds();

  const limit = 24;
  const page = Math.max(1, Number((await searchParams)?.page) || 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: articles, count } = await supabase
    .from('articles')
    .select('*, sources!inner(name)', { count: 'exact' })
    .eq('category', category)
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🏷️ {category}</h1>
        <p className={styles.pageSubtitle}>
          {count ? `${count.toLocaleString()} articles` : 'No articles in this category yet'}
        </p>
      </div>

      <CategoryFeed
        articles={articles || []}
        pagination={{
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        }}
        bookmarkedIds={bookmarkedIds}
        category={category}
      />
    </div>
  );
}
