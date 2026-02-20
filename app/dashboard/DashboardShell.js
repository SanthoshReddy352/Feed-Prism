'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import styles from './layout.module.css';

export default function DashboardShell({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  function handleSearch(e) {
    e.preventDefault();
    const q = e.target.elements.search.value.trim();
    if (q) {
      router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
          >
            <Menu size={24} />
          </button>

          <form onSubmit={handleSearch} className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="search"
                name="search"
                placeholder="Search news, topics, or sources..."
                className={styles.searchInput}
              />
            </div>
          </form>

        </header>

        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
