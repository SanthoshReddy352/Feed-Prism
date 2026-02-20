'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHydrated, useTheme } from './ThemeProvider';
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from './icons';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Sources', href: '#sources' },
  { label: 'Preview', href: '#preview' },
  { label: 'Stats', href: '#stats' },
];

export default function Navbar({ user }) {
  const hydrated = useHydrated();
  const { theme, toggleTheme } = useTheme();
  const effectiveTheme = hydrated ? theme : 'light';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 14);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);
  
  const handleLogoClick = (e) => {
    // If we're already on the home page, scroll to top
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (mobileOpen) setMobileOpen(false);
    }
  };

  return (
    <header className={styles.navbarWrap}>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} onClick={handleLogoClick}>
            <img 
              src="/Mobile Logo.svg" 
              alt="" 
              className={`${styles.logoIconImg} logo-img`}
              width={34}
              height={34}
            />
            <span className={styles.logoText}>Feed Prism</span>
          </Link>

          <div className={styles.navLinks}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              onClick={toggleTheme}
              className={styles.iconBtn}
              aria-label="Toggle theme"
            >
              {effectiveTheme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {user ? (
              <Link href="/dashboard" className={`btn btn-primary ${styles.ctaBtn}`}>
                Open Dashboard
              </Link>
            ) : (
              <Link href="/login" className={`btn btn-primary ${styles.ctaBtn}`}>
                Get Started
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className={styles.hamburger}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-drawer"
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </nav>

      <aside
        id="landing-mobile-drawer"
        className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className={styles.drawerHeader}>
          <Link href="/" className={styles.logo} onClick={handleLogoClick}>
            <img 
              src="/Mobile Logo.svg" 
              alt="" 
              className={`${styles.logoIconImg} logo-img`}
              width={38}
              height={38}
            />
            <span className={styles.logoText}>Feed Prism</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className={styles.drawerClose}
            aria-label="Close menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.drawerLinks}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.drawerLink}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className={styles.drawerFooter}>
          <button onClick={toggleTheme} className={styles.themeToggleDrawer}>
            {effectiveTheme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            <span>{effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
          </button>
          {user ? (
            <Link
              href="/dashboard"
              className={`btn btn-primary ${styles.drawerCta}`}
              onClick={() => setMobileOpen(false)}
            >
              Open Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className={`btn btn-primary ${styles.drawerCta}`}
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          )}
        </div>
      </aside>

      <button
        type="button"
        className={`${styles.overlay} ${mobileOpen ? styles.overlayVisible : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-label="Close menu overlay"
      />
    </header>
  );
}
