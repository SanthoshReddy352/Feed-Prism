'use client';

import { useRouter } from 'next/navigation';
import styles from './FilterBar.module.css';

const CATEGORIES = [
  'All',
  'Technology',
  'AI & ML',
  'Global News',
  'Outbreaks & Health',
  'Company News',
  'Cloud & Infrastructure',
  'Developer & Engineering',
  'Startups',
  'Security',
  'AI Tools',
  'Business',
  'Stocks & Trading',
];

export default function FilterBar({ activeCategory = 'All', viewMode = 'detailed', onViewModeChange }) {
  const router = useRouter();

  function handleCategoryClick(category) {
    if (category === 'All') {
      router.push('/dashboard');
      return;
    }

    const slug = category.toLowerCase().replace(/[&\s]+/g, '-');
    router.push(`/dashboard/category/${slug}`);
  }

  return (
    <div className={styles.filterBar}>
      <div className={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`${styles.pill} ${activeCategory === cat ? styles.pillActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className={styles.viewToggle}>
        <button
          onClick={() => onViewModeChange?.('detailed')}
          className={`${styles.viewBtn} ${viewMode === 'detailed' ? styles.viewBtnActive : ''}`}
          title="Grid view"
          aria-label="Grid view"
        >
          Grid
        </button>
        <button
          onClick={() => onViewModeChange?.('compact')}
          className={`${styles.viewBtn} ${viewMode === 'compact' ? styles.viewBtnActive : ''}`}
          title="List view"
          aria-label="List view"
        >
          List
        </button>
      </div>
    </div>
  );
}
