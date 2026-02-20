import ScrollReveal from './ScrollReveal';
import { ArrowRightIcon } from './icons';
import styles from './CallToAction.module.css';

export default function CallToAction() {
  return (
    <section id="cta" className={styles.section}>
      <div className={styles.bgGlow} />
      <div className={`container ${styles.inner}`}>
        <ScrollReveal>
          <span className={styles.badge}>Get Started Today</span>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h2 className={styles.headline}>
            Ready to take control of
            <br />
            your news consumption?
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className={styles.subtext}>
            Join and experience a smarter way to stay informed. Real-time aggregation, intelligent filtering, and a clean interface designed for clarity.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={300}>
          <a href="#" className={`btn btn-primary ${styles.ctaBtn}`}>
            Start Exploring
            <ArrowRightIcon size={16} />
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
