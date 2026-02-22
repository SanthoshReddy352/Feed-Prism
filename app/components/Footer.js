import Link from 'next/link';
import styles from './Footer.module.css';

const CATEGORIES = [
  { label: 'Technology', href: '/category/Technology' },
  { label: 'AI & ML', href: '/category/AI & ML' },
  { label: 'Global News', href: '/category/Global News' },
  { label: 'Outbreaks', href: '/category/Outbreaks & Health' },
  { label: 'Companies', href: '/category/Company News' },
  { label: 'Cloud & Infra', href: '/category/Cloud & Infrastructure' },
  { label: 'Developer', href: '/category/Developer & Engineering' },
  { label: 'Startups', href: '/category/Startups' },
  { label: 'Security', href: '/category/Security' },
  { label: 'AI Tools', href: '/category/AI Tools' },
  { label: 'Business', href: '/category/Business' },
  { label: 'Stocks', href: '/category/Stocks & Trading' }
];

const PRODUCT_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Sources', href: '/#sources' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' }
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <img 
                src="/Mobile Logo.svg" 
                alt="" 
                className={`${styles.logoIconImg} logo-img`}
                width={32}
                height={32}
              />
              <span className={styles.logoText}>Feed Prism</span>
            </Link>
            <p className={styles.brandDesc}>
              Your intelligent news command center. Aggregating, filtering, and delivering the news that matters.
            </p>
            <p className={styles.tech}>
              Built with Next.js, Supabase & RSS
            </p>
          </div>

          {/* Product */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Product</h4>
            <ul className={styles.linkList}>
              {PRODUCT_LINKS.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Categories</h4>
            <ul className={styles.categoryList}>
              {CATEGORIES.map(cat => (
                <li key={cat.label}>
                  <Link href={cat.href} className={styles.link}>{cat.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Company</h4>
            <ul className={styles.linkList}>
              {COMPANY_LINKS.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Feed Prism. Personal News Dashboard.
          </p>
        </div>
      </div>
    </footer>
  );
}
