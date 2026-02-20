'use client';

import { useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import styles from './ArticleModal.module.css';

function formatDate(dateString) {
  if (!dateString) return 'Recent';

  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ArticleModal({ article, onClose }) {
  useEffect(() => {
    if (!article) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-article-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.category}>{article.category || 'General'}</span>
            <span className={styles.source}>{article.sources?.name || 'News Source'}</span>
            <span className={styles.date}>{formatDate(article.published_at)}</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close article preview"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <h3 id="landing-article-title" className={styles.title}>
          {article.title}
        </h3>

        <p className={styles.description}>
          {article.description || 'No description available for this article yet.'}
        </p>

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.readBtn}
          >
            Read full article <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
