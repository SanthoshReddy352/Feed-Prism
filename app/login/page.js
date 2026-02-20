import Link from 'next/link';
import LoginForm from './LoginForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Sign In — Feed Prism',
  description: 'Sign in to your Feed Prism account to access your personalized news dashboard.',
};

export default function LoginPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.authWrapper}>
        {/* Left: Form Panel */}
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
            <h1 className={styles.authTitle}>Sign In</h1>
          </div>

          <LoginForm />

          {/* Mobile-only footer */}
          <p className={styles.authFooter}>
            Don&apos;t have an account?{' '}
            <Link href="/signup">Create one</Link>
          </p>
        </div>

        {/* Right: Welcome Panel */}
        <div className={styles.welcomePanel}>
          <h2 className={styles.welcomeTitle}>Hey There!</h2>
          <p className={styles.welcomeSubtitle}>
            Create your account now and step into an amazing new journey.
          </p>
          <Link href="/signup" className={styles.welcomeButton}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
