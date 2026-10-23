import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.missclick.sadikoi',
  appName: 'Sadikoi',
  webDir: 'dist/Sadikoi/browser',
  plugins: {
    // API calls go through the phone's native networking instead of the WebView:
    // no CORS preflight, and the login cookies aren't blocked as third-party cookies (iOS).
    CapacitorHttp: { enabled: true },
    // Keeps cookies in the native cookie store, shared with CapacitorHttp.
    CapacitorCookies: { enabled: true },
    // Status bar (built into Capacitor 8): the page goes under it (index.html has viewport-fit=cover,
    // the --safe-* CSS variables keep content clear). Dark icons, as the header is light.
    SystemBars: {
      style: 'LIGHT',
      initialViewportFitValueHint: 'cover',
    },
    // Only Google is used: the other providers' SDKs are left out of the app.
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
};

export default config;
