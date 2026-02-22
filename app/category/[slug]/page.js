import { createClient } from '@/lib/supabase/server';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LivePreview from '../../components/LivePreview';

// Helper to decode category slug back to human readable name
function decodeSlug(slug) {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const categoryName = decodeSlug(slug);
  const suffix = categoryName.toLowerCase().endsWith('news') ? '' : ' News';
  
  return {
    title: `${categoryName}${suffix} | Feed Prism`,
    description: `Latest news and updates for ${categoryName}.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const categoryName = decodeSlug(slug);
  const suffix = categoryName.toLowerCase().endsWith('news') ? '' : ' News';

  // Fetch the user session
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  // Query articles for this specific category
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, description, url, category, image_url, published_at, sources(name)')
    .eq('category', categoryName)
    .order('published_at', { ascending: false })
    .limit(24);

  const displayArticles = Array.isArray(articles) ? articles : [];

  return (
    <>
      <Navbar user={user} />
      <main className="static-page-content" style={{ minHeight: '80vh', padding: '6rem 1rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {categoryName}{suffix}
        </h1>
        
        {displayArticles.length > 0 ? (
          <LivePreview articles={displayArticles} hideHeader={true} />
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>No articles found for this category yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
