import Link from 'next/link';
import SignupForm from './SignupForm';
import styles from '../login/page.module.css';

export const metadata = {
  title: 'Create Account — Feed Prism',
  description: 'Create a Feed Prism account to start aggregating and monitoring news from 500+ sources.',
};

export default function SignupPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.authWrapper}>
        {/* Left: Welcome Panel (mirrored from login) */}
        <div className={styles.welcomePanel}>
          <h2 className={styles.welcomeTitle}>Welcome Back!</h2>
          <p className={styles.welcomeSubtitle}>
            Already have an account? Sign in to continue where you left off.
          </p>
          <Link href="/login" className={styles.welcomeButton}>
            Sign In
          </Link>
        </div>

        {/* Right: Form Panel */}
        <div className={styles.formPanel}>
          <Link href="/" className={styles.logoLink}>
            <img 
              src="/Mobile Logo.svg" 
              alt="" 
              className={`${styles.logoIconImg} logo-img`}
              width={34}
              height={34}
            />
            <span className={styles.logoText}>Feed Prism</span>
          </Link>

          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Create Account</h1>
          </div>

          <SignupForm />

          {/* Mobile-only footer */}
          <p className={styles.authFooter}>
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
