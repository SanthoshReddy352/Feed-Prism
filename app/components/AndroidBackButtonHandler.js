'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

function isExitPromptRoute(pathname) {
  return pathname === '/' || pathname === '/dashboard';
}

export default function AndroidBackButtonHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== 'android') return;

    let listenerHandle = null;

    App.addListener('backButton', ({ canGoBack }) => {
      if (isExitPromptRoute(pathname)) {
        const shouldExit = window.confirm(
          'Do you want to leave Feed Prism? Tap Cancel to stay.'
        );

        if (shouldExit) {
          App.exitApp();
        }
        return;
      }

      if (canGoBack) {
        window.history.back();
      }
    })
      .then((handle) => {
        listenerHandle = handle;
      })
      .catch(() => {});

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [pathname]);

  return null;
}
