'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const AUTH_CALLBACK_SCHEME = 'com.feedprism.app:';
const AUTH_CALLBACK_HOST = 'auth';
const AUTH_CALLBACK_PATH = '/callback';

function resolveAuthCallbackPath(rawUrl) {
  if (!rawUrl) return null;

  try {
    const parsedUrl = new URL(rawUrl);
    const isExpectedCallback =
      parsedUrl.protocol === AUTH_CALLBACK_SCHEME &&
      parsedUrl.hostname === AUTH_CALLBACK_HOST &&
      parsedUrl.pathname.startsWith(AUTH_CALLBACK_PATH);

    if (!isExpectedCallback) return null;
    return `/auth/callback${parsedUrl.search}`;
  } catch {
    return null;
  }
}

export default function CapacitorDeepLinkHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let listenerHandle = null;

    const navigateFromUrl = (incomingUrl) => {
      const targetPath = resolveAuthCallbackPath(incomingUrl);
      if (!targetPath) return;
      window.location.assign(targetPath);
    };

    App.getLaunchUrl()
      .then((launchData) => {
        if (disposed) return;
        navigateFromUrl(launchData?.url);
      })
      .catch(() => {});

    App.addListener('appUrlOpen', ({ url }) => {
      if (disposed) return;
      navigateFromUrl(url);
    })
      .then((handle) => {
        listenerHandle = handle;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return null;
}
