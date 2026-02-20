import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.headerSkeleton}>
        <div className={`${styles.skeleton} ${styles.titleSkeleton}`} />
        <div className={`${styles.skeleton} ${styles.controlsSkeleton}`} />
      </div>

      <div className={styles.featuredSkeleton}>
        <div className={`${styles.skeleton} ${styles.heroSkeleton}`} />
        <div className={styles.sideSkeletons}>
          <div className={`${styles.skeleton} ${styles.sideSkeleton}`} />
          <div className={`${styles.skeleton} ${styles.sideSkeleton}`} />
        </div>
      </div>

      <div className={styles.gridSkeleton}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.cardSkeleton}`} />
        ))}
      </div>
    </div>
  );
}
