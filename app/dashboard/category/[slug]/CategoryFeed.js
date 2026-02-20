'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import ArticleList from '../../components/ArticleList';
import Modal from '../../components/Modal';
import modalStyles from '../../components/Modal.module.css';
import articleStyles from '../../components/ArticleList.module.css';

export default function CategoryFeed({
  articles,
  pagination,
  bookmarkedIds,
}) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  const handleNext = () => {
    if (!selectedArticle) return;
    const currentIndex = articles.findIndex((a) => a.id === selectedArticle.id);
    if (currentIndex < articles.length - 1) {
      setSelectedArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!selectedArticle) return;
    const currentIndex = articles.findIndex((a) => a.id === selectedArticle.id);
    if (currentIndex > 0) {
      setSelectedArticle(articles[currentIndex - 1]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <ArticleList
        initialArticles={articles}
        initialPagination={pagination}
        bookmarkedIds={bookmarkedIds}
        viewMode="detailed"
        onArticleClick={handleArticleClick}
      />

      {selectedArticle && (
        <Modal
          isOpen={!!selectedArticle}
          onClose={handleCloseModal}
          title={selectedArticle.title}
          onNext={handleNext}
          onPrev={handlePrev}
          showNext={articles.findIndex((a) => a.id === selectedArticle.id) < articles.length - 1}
          showPrev={articles.findIndex((a) => a.id === selectedArticle.id) > 0}
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
                {formatDate(selectedArticle.published_at)}
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

            <div className={articleStyles.modalSummary}>
              {selectedArticle.content ? (
                <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
              ) : (
                <p>{selectedArticle.description || 'No summary available.'}</p>
              )}
            </div>

            {selectedArticle.author && (
              <p className={articleStyles.modalAuthor}>By {selectedArticle.author}</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
