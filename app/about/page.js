import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'About | Feed Prism',
  description: 'Learn more about Feed Prism and our mission to simplify your news consumption.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar user={null} />
      <main className="static-page-content" style={{ minHeight: '80vh', padding: '6rem 1rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-primary)' }}>About Feed Prism</h1>
        
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Our Mission</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            At Feed Prism, our mission is to cut through the noise of the modern news cycle. We believe that staying informed shouldn't mean being overwhelmed. By aggregating, filtering, and intelligently categorizing news from over 500 global sources, we empower you to take back control of your information diet.
          </p>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Whether you are tracking global outbreaks, monitoring company intelligence, or simply wanting to catch up on the latest in technology, Feed Prism acts as your personal command center.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>The Technology</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Feed Prism is built utilizing modern web technologies including Next.js and Supabase. Our robust ingestion pipeline ensures you receive news in near real-time, while our intelligent tagging system automatically categorizes articles so you always find what you're looking for.
          </p>
        </section>

      </main>
      <Footer />
    </>
  );
}
