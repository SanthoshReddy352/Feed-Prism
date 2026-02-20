'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './FeaturedFeed.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23444'%3ENews%3C/text%3E%3C/svg%3E";

export default function FeaturedFeed({ articles = [], onArticleClick }) {
  if (!articles || articles.length === 0) return null;

  const heroArticle = articles[0];
  const sideArticles = articles.slice(1, 3);

  return (
    <section className={styles.featured}>
      <div className={styles.header}>
        <span className={styles.badge}>Breaking</span>
        <h2 className={styles.title}>Today&apos;s Headlines</h2>
      </div>

      <div className={styles.grid}>
        <div 
          key={heroArticle.id}
          onClick={() => onArticleClick(heroArticle)} 
          className={styles.heroCard}
        >
          <ArticleImage
            src={heroArticle.image_url}
            alt={heroArticle.title}
            fill
            className={styles.heroImage}
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className={styles.overlay}>
            <div className={styles.metaWrap}>
              <span className={styles.sourceBadge}>
                {heroArticle.sources?.name || 'News'}
              </span>
              <span className={styles.categoryBadge}>
                {heroArticle.category || 'General'}
              </span>
              <span className={styles.timeAgo}>
                {getTimeAgo(heroArticle.published_at)}
              </span>
            </div>
            <h3 className={styles.heroTitle} dangerouslySetInnerHTML={{ __html: heroArticle.title }} />
            {heroArticle.description && (
              <p className={styles.heroExcerpt} dangerouslySetInnerHTML={{ __html: heroArticle.description.slice(0, 150) + '...' }} />
            )}
          </div>
        </div>

        {/* Side Column */}
        <div className={styles.sideColumn}>
          {sideArticles.map((article) => (
            <div 
              key={article.id} 
              onClick={() => onArticleClick(article)} 
              className={styles.sideCard}
            >
              <ArticleImage
                src={article.image_url}
                alt={article.title}
                fill
                className={styles.sideImage}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className={styles.sideOverlay}>
                 <div className={styles.metaWrap}>
                  <span className={`${styles.sourceBadge} ${styles.sideBadge}`}>
                    {article.sources?.name || 'News'}
                  </span>
                  <span className={`${styles.categoryBadge} ${styles.sideBadge}`}>
                    {article.category || 'General'}
                  </span>
                </div>
                <h4 className={styles.sideTitle} dangerouslySetInnerHTML={{ __html: article.title }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleImage({ src, alt, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_IMAGE);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== PLACEHOLDER_IMAGE) {
            setImgSrc(PLACEHOLDER_IMAGE);
        }
      }}
    />
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  
  if (diffMs < 0) return 'Just now';

  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return 'Today';
}
