'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Bookmark, Clock, User } from 'lucide-react';
import { toggleBookmark } from '@/app/actions/bookmarks';
import styles from './ArticleCard.module.css';

export default function ArticleCard({ article, isBookmarked: initialBookmarked = false, viewMode = 'detailed', onClick }) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const timeAgo = getTimeAgo(article.published_at);
  const sourceName = article.sources?.name || article.source_name || 'News';

  function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleBookmark(article.id);
      if (!result.error) {
        setIsBookmarked(result.bookmarked);
      }
    });
  }

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(article);
    }
  };

  if (viewMode === 'compact') {
    return (
      <article className={styles.cardCompact}>
        <div className={styles.compactContent}>
          <div className={styles.compactMeta}>
            <span className={`${styles.sourceBadge} ${styles.compactBadge}`}>{sourceName}</span>
            <span className={`${styles.categoryBadge} ${styles.compactBadge}`}>{article.category || 'General'}</span>
            <span className={styles.timeAgo} suppressHydrationWarning>{timeAgo}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.compactTitle}
            onClick={handleClick}
          >
            {article.title}
          </a>
        </div>
        <button
          onClick={handleBookmark}
          disabled={isPending}
          className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <div className={styles.metaLeft}>
            <span className={styles.sourceBadge}>{sourceName}</span>
            <span className={styles.categoryBadge}>{article.category || 'General'}</span>
          </div>
          <span className={styles.timeAgo} suppressHydrationWarning>
            <Clock size={12} className={styles.timeIcon} />
            {timeAgo}
          </span>
        </div>
        
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.title}
          onClick={handleClick}
        >
          {article.title}
        </a>
        


        <div className={styles.footer}>
          {article.author ? (
            <span className={styles.author}>
              <User size={12} />
              <span className={styles.authorName}>{article.author}</span>
            </span>
          ) : <span></span>}
          
          <button
            onClick={handleBookmark}
            disabled={isPending}
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  
  const absDiff = Math.abs(diffMs);
  const diffMin = Math.floor(absDiff / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMs < 0) {
    // Future
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `in ${diffMin}m`;
    if (diffHr < 24) return `in ${diffHr}h`;
    if (diffDay < 7) return `in ${diffDay}d`;
    return then.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Past
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
