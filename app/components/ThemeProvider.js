'use client';

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

const THEME_KEY = 'feed-prism-theme';
const THEME_EVENT = 'feedprism-theme-change';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

function readThemeFromBrowser() {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = localStorage.getItem(THEME_KEY);
  const attrTheme = document.documentElement.getAttribute('data-theme');
  const theme = storedTheme || attrTheme || 'light';

  return theme === 'dark' ? 'dark' : 'light';
}

function subscribeTheme(onStoreChange) {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event) => {
    if (!event.key || event.key === THEME_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readThemeFromBrowser,
    () => 'light'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTheme = localStorage.getItem(THEME_KEY);
    const normalizedStoredTheme =
      storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;

    // During hydration, avoid overwriting a persisted preference with the server fallback.
    if (normalizedStoredTheme && normalizedStoredTheme !== theme) {
      document.documentElement.setAttribute('data-theme', normalizedStoredTheme);
      window.dispatchEvent(new Event(THEME_EVENT));
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        if (typeof window === 'undefined') return;
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem(THEME_KEY, nextTheme);
        window.dispatchEvent(new Event(THEME_EVENT));
      },
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = localStorage.getItem('${THEME_KEY}') || 'light';
                document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
              } catch (e) {}
            })();
          `,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}
