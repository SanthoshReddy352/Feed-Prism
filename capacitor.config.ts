import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.feedprism.app',
  appName: 'Feed Prism',
  webDir: 'public',
  server: {
    url: 'https://feed-prism.vercel.app/',
    cleartext: true
  }
};

export default config;
