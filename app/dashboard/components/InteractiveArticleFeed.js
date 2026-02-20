'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import ArticleList from './ArticleList';
import Modal from './Modal';
import modalStyles from './Modal.module.css';
import articleStyles from './ArticleList.module.css';

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InteractiveArticleFeed({
  articles = [],
  pagination = {},
  bookmarkedIds = [],
  viewMode = 'detailed',
}) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const selectedIndex = useMemo(
    () => (selectedArticle ? articles.findIndex((a) => a.id === selectedArticle.id) : -1),
    [articles, selectedArticle]
  );

  const handleNext = () => {
    if (selectedIndex < 0 || selectedIndex >= articles.length - 1) return;
    setSelectedArticle(articles[selectedIndex + 1]);
  };

  const handlePrev = () => {
    if (selectedIndex <= 0) return;
    setSelectedArticle(articles[selectedIndex - 1]);
  };

  return (
    <>
      <ArticleList
        initialArticles={articles}
        initialPagination={pagination}
        bookmarkedIds={bookmarkedIds}
        viewMode={viewMode}
        onArticleClick={setSelectedArticle}
      />

      {selectedArticle && (
        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          onNext={handleNext}
          onPrev={handlePrev}
          showNext={selectedIndex >= 0 && selectedIndex < articles.length - 1}
          showPrev={selectedIndex > 0}
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
                <p>{selectedArticle.description || selectedArticle.summary || 'No summary available.'}</p>
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
