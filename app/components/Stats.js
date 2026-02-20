'use client';

import { useEffect, useRef, useState } from 'react';
import ScrollReveal from './ScrollReveal';
import styles from './Stats.module.css';

const DEFAULT_STATS = [
  { value: 0, suffix: '', label: 'Active Sources', prefix: '' },
  { value: 0, suffix: '+', label: 'Articles Indexed', prefix: '' },
  { value: 0, suffix: '', label: 'Published Today', prefix: '' },
  { value: 0, suffix: '', label: 'Categories', prefix: '' },
];

function AnimatedCounter({ value, suffix, prefix, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={styles.value}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

export default function Stats({ stats = DEFAULT_STATS }) {
  const data = stats.length ? stats : DEFAULT_STATS;

  return (
    <section id="stats" className={`section ${styles.section}`}>
      <div className="container">
        <ScrollReveal>
          <div className={styles.header}>
            <span className="section-label">By the Numbers</span>
            <h2 className="section-title">Built for scale, designed for speed</h2>
          </div>
        </ScrollReveal>

        <div className={styles.grid}>
          {data.map((stat, i) => (
            <ScrollReveal key={`${stat.label}-${i}`} delay={i * 100}>
              <div className={styles.card}>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
                <span className={styles.label}>{stat.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
