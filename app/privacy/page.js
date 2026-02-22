import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Privacy Policy | Feed Prism',
  description: 'Learn how Feed Prism handles and protects your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar user={null} />
      <main className="static-page-content" style={{ minHeight: '80vh', padding: '6rem 1rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-primary)' }}>Privacy Policy</h1>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>1. Information We Collect</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            We collect information you provide directly to us when you create an account, such as your email address. We also collect usage data (like IP addresses and browsing behavior) to improve our service.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>2. How We Use Your Information</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            We use the information we collect to operate, maintain, and improve our services, communicate with you, and personalize your experience. We do not sell your personal data to third parties.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-secondary)' }}>3. Data Security</h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            We take reasonable measures to protect the information you provide us from loss, theft, misuse, and unauthorized access. All user data is stored securely using an encrypted database provided by Supabase.
          </p>
        </section>

      </main>
      <Footer />
    </>
  );
}
