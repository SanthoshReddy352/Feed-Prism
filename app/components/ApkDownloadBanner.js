'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import styles from './ApkDownloadBanner.module.css';
import { useHydrated } from './ThemeProvider';

const DISMISS_KEY = 'feed-prism-apk-banner-dismissed-v1';
const APK_URL = '/Feed%20Prism.apk';
const BANNER_ID = 'apk-download-banner';

function readDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function ApkDownloadBanner() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const [dismissedInSession, setDismissedInSession] = useState(false);

  const isNative = hydrated && Capacitor.isNativePlatform();
  const isPersistedDismissed = hydrated && readDismissed();
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  if (!hydrated || dismissedInSession || isPersistedDismissed || isNative || isDashboardRoute) {
    return null;
  }

  function closeBanner(event) {
    event?.preventDefault?.();
    const banner = document.getElementById(BANNER_ID);
    if (banner) {
      banner.style.display = 'none';
    }
    setDismissedInSession(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  }

  return (
    <aside
      id={BANNER_ID}
      className={styles.banner}
      role="region"
      aria-label="Android app download banner"
    >
      <div className={styles.copy}>
        <p className={styles.title}>Get Feed Prism for Android</p>
        <p className={styles.subtitle}>Download the APK and install the app on your phone.</p>
      </div>

      <div className={styles.actions}>
        <a href={APK_URL} className={styles.downloadButton} download>
          Download APK
        </a>
        <button
          type="button"
          className={styles.closeButton}
          onClick={closeBanner}
          onTouchStart={closeBanner}
          aria-label="Close download banner"
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
