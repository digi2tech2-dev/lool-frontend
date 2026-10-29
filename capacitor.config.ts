import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL || 'https://ad-card.com';

let allowedHost = 'ad-card.com';
try {
  const parsedUrl = new URL(serverUrl);
  if (parsedUrl.protocol !== 'https:') throw new Error('CAPACITOR_SERVER_URL must use HTTPS.');
  allowedHost = parsedUrl.host;
} catch (error) {
  throw new Error(`Invalid CAPACITOR_SERVER_URL: ${error instanceof Error ? error.message : 'Expected an HTTPS URL.'}`);
}

const config: CapacitorConfig = {
  appId: 'com.adcard.app',
  appName: 'Lool Store',
  webDir: 'dist',
  server: {
    url: serverUrl,
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [allowedHost],
  },
  android: { allowMixedContent: false },
};

export default config;
