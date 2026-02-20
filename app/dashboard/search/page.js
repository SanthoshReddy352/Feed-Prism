'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Filter } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import styles from './page.module.css';

const CATEGORY_OPTIONS = [
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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef(null);

  const query = searchParams.get('q') || '';
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(Boolean(query.trim()));
  const [pagination, setPagination] = useState({});
  const [error, setError] = useState('');
  const [isCategoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const currentCategoryLabel = useMemo(
    () => (category || 'All Categories'),
    [category]
  );

  const performSearch = useCallback(async (searchQuery, filterCategory) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setPagination({});
      setSearched(false);
      setError('');
      return;
    }

    setLoading(true);
    setSearched(true);
    setError('');

    try {
      const params = new URLSearchParams({ q: trimmedQuery });
      if (filterCategory) params.set('category', filterCategory);

      const res = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Search request failed.');
      }

      setResults(Array.isArray(json.data) ? json.data : []);
      setPagination(json.pagination || {});
    } catch (searchError) {
      console.error('Search failed:', searchError);
      setResults([]);
      setPagination({});
      setError(searchError.message || 'Unable to search right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialCategory = searchParams.get('category') || '';
    setCategory(initialCategory);

    if (query.trim()) {
      performSearch(query, initialCategory);
    } else {
      setSearched(false);
      setResults([]);
      setPagination({});
      setError('');
    }
  }, [searchParams, query, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setCategoryMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setCategoryMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function applyCategoryFilter(nextCategory) {
    setCategory(nextCategory);
    setCategoryMenuOpen(false);
    performSearch(query, nextCategory);

    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (nextCategory) params.set('category', nextCategory);
    const nextUrl = params.toString() ? `/dashboard/search?${params.toString()}` : '/dashboard/search';
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Search Results</h1>
        <p className={styles.pageSubtitle}>
          {query.trim()
            ? `Showing results for "${query}"`
            : 'Use the top search bar to search articles by title or description.'}
        </p>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.queryBadge}>
          <Filter size={14} />
          <span>{query.trim() || 'No active query'}</span>
        </div>

        <div className={styles.customSelect} ref={dropdownRef}>
          <button
            type="button"
            className={styles.selectTrigger}
            onClick={() => setCategoryMenuOpen((prev) => !prev)}
            aria-expanded={isCategoryMenuOpen}
            aria-haspopup="listbox"
          >
            <span>{currentCategoryLabel}</span>
            <ChevronDown size={16} className={isCategoryMenuOpen ? styles.triggerOpen : ''} />
          </button>

          {isCategoryMenuOpen && (
            <div className={styles.menu} role="listbox" aria-label="Filter by category">
              <button
                type="button"
                className={`${styles.menuItem} ${category === '' ? styles.menuItemActive : ''}`}
                onClick={() => applyCategoryFilter('')}
              >
                All Categories
              </button>
              {CATEGORY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.menuItem} ${category === item ? styles.menuItemActive : ''}`}
                  onClick={() => applyCategoryFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {searched && (
        <div className={styles.resultsSection}>
          <p className={styles.resultCount}>
            {loading ? 'Searching...' : `${pagination.total || 0} results found`}
          </p>

          {error && <p className={styles.emptyText}>{error}</p>}

          {!loading && !error && results.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>No results</div>
              <h3 className={styles.emptyTitle}>No results found</h3>
              <p className={styles.emptyText}>Try another query from the top search bar.</p>
            </div>
          )}

          <div className={styles.resultsList}>
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} viewMode="compact" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
