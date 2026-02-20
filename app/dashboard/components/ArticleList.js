'use client';

import ArticleCard from './ArticleCard';
import Pagination from './Pagination';
import styles from './ArticleList.module.css';

export default function ArticleList({
  initialArticles = [],
  initialPagination = {},
  bookmarkedIds = [],
  viewMode = 'detailed',
  onArticleClick,
}) {
  const articles = initialArticles;
  const { totalPages } = initialPagination;

  if (!articles.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📭</div>
        <h3 className={styles.emptyTitle}>No articles found</h3>
        <p className={styles.emptyText}>
          Try adjusting your filters or check back later for new articles.
        </p>
      </div>
    );
  }

  const handleArticleClick = (article) => {
    if (onArticleClick) {
      onArticleClick(article);
    }
  };

  return (
    <div>
      <div className={viewMode === 'compact' ? styles.listCompact : styles.grid}>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isBookmarked={bookmarkedIds.includes(article.id)}
            viewMode={viewMode}
            onClick={handleArticleClick}
          />
        ))}
      </div>

      <Pagination totalPages={totalPages} />
    </div>
  );
}
