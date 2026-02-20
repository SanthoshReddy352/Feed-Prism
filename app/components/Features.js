import ScrollReveal from './ScrollReveal';
import { RssIcon, ShieldIcon, SearchIcon, GlobeIcon, BuildingIcon, LayoutIcon } from './icons';
import styles from './Features.module.css';

const FEATURES = [
  {
    icon: RssIcon,
    title: 'Real-time RSS Aggregation',
    description: 'Automatically fetch and parse news from 500+ RSS feeds every 15 minutes with smart deduplication.',
  },
  {
    icon: ShieldIcon,
    title: 'Outbreak Monitoring',
    description: 'Track global health alerts and pandemic updates from WHO, CDC, and trusted medical sources.',
  },
  {
    icon: BuildingIcon,
    title: 'Company Intelligence',
    description: 'Follow news from Google, Meta, OpenAI, and other major tech companies in dedicated feeds.',
  },
  {
    icon: SearchIcon,
    title: 'Smart Filtering & Search',
    description: 'Full-text search with category and source filters. Find any article in milliseconds.',
  },
  {
    icon: GlobeIcon,
    title: 'Multi-source Integration',
    description: 'Aggregate from Reuters, TechCrunch, BBC, Ars Technica, and hundreds of other trusted sources.',
  },
  {
    icon: LayoutIcon,
    title: 'Clean Reading Interface',
    description: 'Distraction-free layout with dark mode, bookmarks, and personalized feed preferences.',
  },
];

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <ScrollReveal>
          <div className={styles.header}>
            <span className="section-label">Features</span>
            <h2 className="section-title">Everything you need to stay informed</h2>
            <p className="section-subtitle">
              A powerful suite of tools designed to aggregate, organize, and deliver the news that matters most to you.
            </p>
          </div>
        </ScrollReveal>

        <div className={`${styles.grid} stagger-children`}>
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className={styles.card}>
                <div className={styles.iconWrap}>
                  <feature.icon size={22} />
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDesc}>{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
