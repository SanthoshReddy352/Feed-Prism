import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Blog | Feed Prism',
  description: 'Read the latest updates, stories, and insights from the Feed Prism team.',
};

export default function BlogPage() {
  return (
    <>
      <Navbar user={null} />
      <main className="static-page-content" style={{ minHeight: '80vh', padding: '6rem 1rem 4rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Feed Prism Blog</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          Stories, updates, and insights.
        </p>

        <div style={{ padding: '4rem', background: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Coming Soon</h2>
          <p style={{ color: 'var(--text-secondary)' }}>We're working on bringing you great content. Check back later!</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
