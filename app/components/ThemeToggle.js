'use client';

import { Moon, Sun } from 'lucide-react';
import { useHydrated, useTheme } from './ThemeProvider';
import styles from '../dashboard/components/Sidebar.module.css'; // Reusing generic button styles or creating new ones

export default function ThemeToggle() {
  const hydrated = useHydrated();
  const { theme, toggleTheme } = useTheme();
  const effectiveTheme = hydrated ? theme : 'light';

  return (
    <button
      onClick={toggleTheme}
      className={styles.link} // Reusing sidebar link style for consistency if placed there
      title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
      style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer' }}
    >
      <span className={styles.icon}>
        {effectiveTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      <span>{effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}
