'use client';

import { useState } from 'react';
import ScrollReveal from './ScrollReveal';
import ArticleModal from './ArticleModal';
import styles from './LivePreview.module.css';

function getTimeAgo(dateString) {
  if (!dateString) return 'recent';

  const diffMs = Date.now() - new Date(dateString).getTime();
  if (diffMs < 60_000) return 'just now';

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function LivePreview({ articles = [] }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const previewArticles = articles.slice(0, 9);

  return (
    <>
      <section id="preview" className="section">
        <div className="container">
          <ScrollReveal>
            <div className={styles.header}>
              <span className="section-label">Live Preview</span>
              <h2 className="section-title">Live feed snapshot</h2>
              <p className="section-subtitle">
                Streaming headlines from your latest ingested articles.
              </p>
            </div>
          </ScrollReveal>

          {previewArticles.length === 0 ? (
            <div className={styles.emptyState}>
              No recent articles found yet. Start ingestion to see live content here.
            </div>
          ) : (
            <div className={`${styles.grid} stagger-children`}>
              {previewArticles.map((article, i) => {
                const sourceName = article.sources?.name || 'News Source';

                return (
                  <ScrollReveal key={article.id || i} delay={i * 80}>
                    <button
                      type="button"
                      className={styles.card}
                      onClick={() => setSelectedArticle(article)}
                      aria-label={`Open article: ${article.title}`}
                    >
                      <div className={styles.topRow}>
                        <span className={styles.liveTag}>
                          <span className={styles.liveDot} />
                          LIVE
                        </span>
                        <span className={styles.categoryBadge}>{article.category || 'General'}</span>
                      </div>

                      <h3 className={styles.title}>{article.title}</h3>

                      <div className={styles.meta}>
                        <span className={styles.source}>{sourceName}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.time}>{getTimeAgo(article.published_at)}</span>
                      </div>
                    </button>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </>
  );
}
