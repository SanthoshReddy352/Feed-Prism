import styles from './Footer.module.css';

const CATEGORIES = ['Technology', 'AI & ML', 'Global News', 'Outbreaks', 'Companies', 'Security', 'Startups'];
const PRODUCT_LINKS = ['Features', 'Sources', 'Categories', 'Dashboard', 'API'];
const COMPANY_LINKS = ['About', 'Blog', 'Privacy', 'Terms'];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <a href="#" className={styles.logo}>
              <img 
                src="/Mobile Logo.svg" 
                alt="" 
                className={`${styles.logoIconImg} logo-img`}
                width={32}
                height={32}
              />
              <span className={styles.logoText}>Feed Prism</span>
            </a>
            <p className={styles.brandDesc}>
              Your intelligent news command center. Aggregating, filtering, and delivering the news that matters.
            </p>
            <p className={styles.tech}>
              Built with Next.js & Supabase
            </p>
          </div>

          {/* Product */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Product</h4>
            <ul className={styles.linkList}>
              {PRODUCT_LINKS.map(link => (
                <li key={link}>
                  <a href="#" className={styles.link}>{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Categories</h4>
            <ul className={styles.linkList}>
              {CATEGORIES.map(cat => (
                <li key={cat}>
                  <a href="#" className={styles.link}>{cat}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Company</h4>
            <ul className={styles.linkList}>
              {COMPANY_LINKS.map(link => (
                <li key={link}>
                  <a href="#" className={styles.link}>{link}</a>
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
