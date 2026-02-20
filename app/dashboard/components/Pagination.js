'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

export default function Pagination({ totalPages }) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  if (totalPages <= 1) return null;

  function createPageUrl(page) {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `?${params.toString()}`;
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={styles.pagination}>
      <Link
        href={createPageUrl(currentPage - 1)}
        className={`${styles.pageBtn} ${currentPage <= 1 ? styles.disabled : ''}`}
        aria-disabled={currentPage <= 1}
        onClick={(e) => currentPage <= 1 && e.preventDefault()}
      >
        <ChevronLeft size={18} />
      </Link>

      {getPageNumbers().map((page, idx) => (
        typeof page === 'number' ? (
          <Link
            key={idx}
            href={createPageUrl(page)}
            className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
          >
            {page}
          </Link>
        ) : (
          <span key={idx} className={styles.dots}>...</span>
        )
      ))}

      <Link
        href={createPageUrl(currentPage + 1)}
        className={`${styles.pageBtn} ${currentPage >= totalPages ? styles.disabled : ''}`}
        aria-disabled={currentPage >= totalPages}
        onClick={(e) => currentPage >= totalPages && e.preventDefault()}
      >
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}
