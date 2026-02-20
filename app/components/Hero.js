'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';
import { ArrowRightIcon, ChevronDownIcon } from './icons';
import ArticleModal from './ArticleModal';
import styles from './Hero.module.css';

function getTimeAgo(dateString) {
  if (!dateString) return 'recently';

  const diffMs = Date.now() - new Date(dateString).getTime();
  if (diffMs < 60_000) return 'just now';

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function HeroCard({ article, onOpen }) {
  const category = article?.category || 'General';
  const sourceName = article?.sources?.name || 'News Source';

  return (
    <button
      type="button"
      className={`${styles.mockCard} ${article ? styles.mockCardInteractive : styles.mockCardDisabled}`}
      onClick={() => article && onOpen(article)}
      disabled={!article}
      aria-label={article ? `Open article: ${article.title}` : 'No article available'}
    >
      <span className={styles.cardBadge}>{category}</span>
      <div className={styles.mockTitle}>
        {article?.title || 'Latest updates from trusted sources in your personalized feed.'}
      </div>
      <div className={styles.mockMeta}>
        <span>{sourceName}</span>
        <span>{getTimeAgo(article?.published_at)}</span>
      </div>
    </button>
  );
}

export default function Hero({ user, spotlightArticles = [] }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const articleA = spotlightArticles[0] || null;
  const articleB = spotlightArticles[1] || null;
  const articleC = spotlightArticles[2] || null;

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgGrid} />

        <div className={`container ${styles.inner}`}>
          <div className={styles.content}>
            <ScrollReveal>
              <span className={styles.badge}>
                <span className={styles.badgeDot} />
                Real-time News Intelligence
              </span>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className={styles.headline}>
                Your Intelligent
                <br />
                <span className={styles.gradient}>News Command</span>
                <br />
                Center
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className={styles.subtext}>
                Live articles from your database, categorized and updated continuously so you can
                track what matters without noise.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className={styles.ctas}>
                {user ? (
                  <Link href="/dashboard" className="btn btn-primary">
                    Open Dashboard
                    <ArrowRightIcon size={16} />
                  </Link>
                ) : (
                  <Link href="/login" className="btn btn-primary">
                    Explore News
                    <ArrowRightIcon size={16} />
                  </Link>
                )}
                <a href="#sources" className="btn btn-outline">
                  View Sources
                </a>
              </div>
            </ScrollReveal>
          </div>

          <div className={styles.visual}>
            <div className={styles.cardFloat1}>
              <HeroCard article={articleA} onOpen={setSelectedArticle} />
            </div>
            <div className={styles.cardFloat2}>
              <HeroCard article={articleB} onOpen={setSelectedArticle} />
            </div>
            <div className={styles.cardFloat3}>
              <HeroCard article={articleC} onOpen={setSelectedArticle} />
            </div>
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <ChevronDownIcon size={20} />
        </div>
      </section>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </>
  );
}
