'use client';

import { useMemo, useState, useTransition } from 'react';
import styles from './page.module.css';

export default function SettingsForm({ categories, sources, preferences, updatePreferences }) {
  const [selectedCategories, setSelectedCategories] = useState(preferences?.preferred_categories || []);
  const [selectedSources, setSelectedSources] = useState(preferences?.preferred_sources || []);
  const [viewMode, setViewMode] = useState(preferences?.view_mode || 'detailed');
  const [sourceQuery, setSourceQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState('');

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleSource(sourceId) {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    selectedCategories.forEach((c) => formData.append('categories', c));
    selectedSources.forEach((s) => formData.append('sources', s));
    formData.set('view_mode', viewMode);

    startTransition(async () => {
      const result = await updatePreferences(formData);
      if (result?.success) {
        setFeedback('Preferences saved successfully.');
        setTimeout(() => setFeedback(''), 3000);
      } else if (result?.error) {
        setFeedback(`Error: ${result.error}`);
      }
    });
  }

  const filteredSources = useMemo(() => {
    const query = sourceQuery.trim().toLowerCase();
    if (!query) return sources;

    return sources.filter(
      (source) =>
        source.name.toLowerCase().includes(query) ||
        source.category.toLowerCase().includes(query)
    );
  }, [sources, sourceQuery]);

  const groupedSources = useMemo(
    () =>
      filteredSources.reduce((acc, source) => {
        if (!acc[source.category]) acc[source.category] = [];
        acc[source.category].push(source);
        return acc;
      }, {}),
    [filteredSources]
  );

  return (
    <div className={styles.settingsShell}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>
          Tailor your dashboard by selecting preferred categories, sources, and layout mode.
        </p>
      </div>

      <div className={styles.summaryBar}>
        <span className={styles.summaryItem}>{selectedCategories.length} categories selected</span>
        <span className={styles.summaryItem}>{selectedSources.length} sources selected</span>
        <span className={styles.summaryItem}>View: {viewMode === 'detailed' ? 'Detailed' : 'Compact'}</span>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Preferred Categories</h2>
            <p className={styles.sectionDesc}>
              Pick categories to prioritize in your feed. Leave all unchecked to include everything.
            </p>
            <div className={styles.checkGrid}>
              {categories.map((cat) => (
                <label
                  key={cat}
                  className={`${styles.checkItem} ${selectedCategories.includes(cat) ? styles.checkItemActive : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className={styles.hiddenInput}
                  />
                  <span className={styles.checkLabel}>{cat}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeadRow}>
              <div>
                <h2 className={styles.sectionTitle}>Preferred Sources</h2>
                <p className={styles.sectionDesc}>
                  Follow specific sources. Leave all unchecked to include every source.
                </p>
              </div>
              <input
                type="search"
                value={sourceQuery}
                onChange={(e) => setSourceQuery(e.target.value)}
                placeholder="Filter sources..."
                className={styles.sourceSearch}
              />
            </div>

            {Object.keys(groupedSources).length === 0 && (
              <p className={styles.emptyText}>No sources match your filter.</p>
            )}

            {Object.entries(groupedSources).map(([category, srcs]) => (
              <div key={category} className={styles.sourceGroup}>
                <h3 className={styles.sourceGroupTitle}>{category}</h3>
                <div className={styles.checkGrid}>
                  {srcs.map((source) => (
                    <label
                      key={source.id}
                      className={`${styles.checkItem} ${selectedSources.includes(source.id) ? styles.checkItemActive : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => toggleSource(source.id)}
                        className={styles.hiddenInput}
                      />
                      <span className={styles.checkLabel}>{source.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>View Mode</h2>
            <p className={styles.sectionDesc}>
              Choose how articles are displayed in your feed.
            </p>
            <div className={styles.viewOptions}>
              <label className={`${styles.viewOption} ${viewMode === 'detailed' ? styles.viewOptionActive : ''}`}>
                <input
                  type="radio"
                  name="view_mode"
                  value="detailed"
                  checked={viewMode === 'detailed'}
                  onChange={(e) => setViewMode(e.target.value)}
                  className={styles.hiddenInput}
                />
                <span className={styles.viewLabel}>Detailed (Grid)</span>
              </label>
              <label className={`${styles.viewOption} ${viewMode === 'compact' ? styles.viewOptionActive : ''}`}>
                <input
                  type="radio"
                  name="view_mode"
                  value="compact"
                  checked={viewMode === 'compact'}
                  onChange={(e) => setViewMode(e.target.value)}
                  className={styles.hiddenInput}
                />
                <span className={styles.viewLabel}>Compact (List)</span>
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Save Changes</h2>
            <p className={styles.sectionDesc}>
              Changes apply immediately after saving.
            </p>
            <div className={styles.actions}>
              <button type="submit" disabled={isPending} className={styles.saveBtn}>
                {isPending ? 'Saving...' : 'Save Preferences'}
              </button>
              {feedback && <span className={styles.feedback}>{feedback}</span>}
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
