'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Newspaper, 
  Bookmark, 
  Search, 
  Settings, 
  Cpu, 
  Bot, 
  Globe, 
  Activity, 
  Building2, 
  Rocket, 
  Shield,
  Cloud,
  Code2,
  LogOut,
  CalendarClock,
  Sparkles,
  Briefcase,
  TrendingUp,
  X
} from 'lucide-react';
import { logout } from '@/app/actions/auth';
import ThemeToggle from '@/app/components/ThemeToggle';
import styles from './Sidebar.module.css';

const CATEGORIES = [
  { name: 'Technology', icon: Cpu },
  { name: 'AI & ML', icon: Bot },
  { name: 'Global News', icon: Globe },
  { name: 'Outbreaks & Health', icon: Activity },
  { name: 'Company News', icon: Building2 },
  { name: 'Startups', icon: Rocket },
  { name: 'Security', icon: Shield },
  { name: 'Cloud & Infrastructure', icon: Cloud },
  { name: 'Developer & Engineering', icon: Code2 },
  { name: 'AI Tools', icon: Sparkles },
  { name: 'Business', icon: Briefcase },
  { name: 'Stocks & Trading', icon: TrendingUp },
];

const NAV_ITEMS = [
  { href: '/dashboard', icon: Newspaper, label: 'Feed' },
  { href: '/dashboard/scheduled', icon: CalendarClock, label: 'Scheduled' },
  { href: '/dashboard/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ user, isOpen, onClose }) {
  const pathname = usePathname();
  const sidebarRef = useRef(null);

  const initial = user?.email?.charAt(0)?.toUpperCase() || '?';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;
    const focusTarget = sidebarRef.current.querySelector('button, a');
    focusTarget?.focus();
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        id="dashboard-sidebar"
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Dashboard navigation"
      >
        <div className={styles.header}>
          <Link href="/" className={styles.logoLink} onClick={onClose}>
            <img 
              src="/Mobile Logo.svg" 
              alt="" 
              className={`${styles.logoIconImg} logo-img`}
              width={32}
              height={32}
            />
            <span className={styles.logoText}>Feed Prism</span>
          </Link>
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Menu</p>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.icon}><Icon size={18} /></span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Categories</p>
            {CATEGORIES.map((cat) => {
              const slug = cat.name.toLowerCase().replace(/[&\s]+/g, '-');
              const isActive = pathname === `/dashboard/category/${slug}`;
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={`/dashboard/category/${slug}`}
                  className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.icon}><Icon size={18} /></span>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={styles.footer}>
          <div className={styles.themeToggleWrap}>
            <ThemeToggle />
          </div>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className={styles.logoutBtn}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
