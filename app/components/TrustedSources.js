import ScrollReveal from './ScrollReveal';
import styles from './TrustedSources.module.css';

export default function TrustedSources({ sources = [] }) {
  const items = sources.slice(0, 18);
  const hasSources = items.length > 0;

  return (
    <section id="sources" className={`section ${styles.section}`}>
      <div className="container">
        <ScrollReveal>
          <div className={styles.header}>
            <span className="section-label">Trusted Sources</span>
            <h2 className="section-title">Powered by reliable journalism</h2>
            <p className="section-subtitle">
              Live source list pulled directly from your configured news providers.
            </p>
          </div>
        </ScrollReveal>

        {!hasSources ? (
          <div className={styles.emptyState}>
            No active sources configured yet. Add sources to start your live stream.
          </div>
        ) : (
          <>
            <div className={styles.marqueeWrapper}>
              <div className={styles.marquee}>
                {[...items, ...items].map((source, i) => (
                  <div key={`${source}-${i}`} className={styles.sourceItem}>
                    <span className={styles.sourceName}>{source}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.marqueeWrapper}>
              <div className={`${styles.marquee} ${styles.marqueeReverse}`}>
                {[...items.slice().reverse(), ...items.slice().reverse()].map((source, i) => (
                  <div key={`${source}-reverse-${i}`} className={styles.sourceItem}>
                    <span className={styles.sourceName}>{source}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
