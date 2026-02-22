import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Terms of Service | Feed Prism',
  description: 'Read the terms and conditions for using Feed Prism.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar user={null} />
      <main className="static-page-content" style={{ minHeight: '80vh', padding: '6rem 1rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-primary)' }}>Terms of Service</h1>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>1. Acceptance of Terms</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            By accessing or using Feed Prism, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>2. Use License</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Permission is granted to temporarily download one copy of the materials (information or software) on Feed Prism for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>3. Disclaimer</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            The materials on Feed Prism's website are provided on an 'as is' basis. Feed Prism makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Furthermore, Feed Prism aggregates links and data from third-party sources. We do not host or claim ownership over the news articles linked on our platform.
          </p>
        </section>

      </main>
      <Footer />
    </>
  );
}
