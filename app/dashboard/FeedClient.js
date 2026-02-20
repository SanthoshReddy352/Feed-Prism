'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import ArticleList from './components/ArticleList';
import FilterBar from './components/FilterBar';
import FeaturedFeed from './components/FeaturedFeed';
import Modal from './components/Modal';
import styles from './page.module.css';
import modalStyles from './components/Modal.module.css';
import articleStyles from './components/ArticleList.module.css';

export default function FeedClient({
  initialArticles,
  featuredArticles = [],
  initialPagination,
  bookmarkedIds,
  viewMode: initialViewMode,
}) {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const allArticles = [...featuredArticles, ...initialArticles];

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  const handleNext = () => {
    if (!selectedArticle) return;
    const currentIndex = allArticles.findIndex((a) => a.id === selectedArticle.id);
    if (currentIndex < allArticles.length - 1) {
      setSelectedArticle(allArticles[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!selectedArticle) return;
    const currentIndex = allArticles.findIndex((a) => a.id === selectedArticle.id);
    if (currentIndex > 0) {
      setSelectedArticle(allArticles[currentIndex - 1]);
    }
  };

  return (
    <div className={styles.feedContainer}>
      {initialPagination.page === 1 && featuredArticles.length > 0 && (
        <FeaturedFeed articles={featuredArticles} onArticleClick={handleArticleClick} />
      )}

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Latest News</h1>
        <div className={styles.headerControls}>
          <FilterBar
            activeCategory="All"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      <ArticleList
        initialArticles={initialArticles}
        initialPagination={initialPagination}
        bookmarkedIds={bookmarkedIds}
        viewMode={viewMode}
        onArticleClick={handleArticleClick}
      />

      {selectedArticle && (
        <Modal
          isOpen={!!selectedArticle}
          onClose={handleCloseModal}
          title={selectedArticle.title}
          onNext={handleNext}
          onPrev={handlePrev}
          showNext={allArticles.findIndex((a) => a.id === selectedArticle.id) < allArticles.length - 1}
          showPrev={allArticles.findIndex((a) => a.id === selectedArticle.id) > 0}
          footer={
            <a
              href={selectedArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className={modalStyles.primaryButton}
            >
              Read Full Article <ExternalLink size={16} />
            </a>
          }
        >
          <div className={articleStyles.modalBody}>
            <div className={articleStyles.metaContainer}>
              <span className={articleStyles.sourceName}>
                {selectedArticle.sources?.name || selectedArticle.source_name}
              </span>
              <span>&bull;</span>
              <span className={articleStyles.categoryBadge}>
                {selectedArticle.category || 'General'}
              </span>
              <span>&bull;</span>
              <span className={articleStyles.time}>
                {new Date(selectedArticle.published_at).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {selectedArticle.image_url && (
              <div className={articleStyles.modalImageWrapper}>
                <Image
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  fill
                  className={articleStyles.modalImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}

            <p className={articleStyles.modalSummary}>
              {selectedArticle.description ||
                selectedArticle.summary ||
                'No summary available for this article.'}
            </p>

            {selectedArticle.author && (
              <p className={articleStyles.modalAuthor}>By {selectedArticle.author}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
