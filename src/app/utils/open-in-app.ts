import { environment } from '../../environments/environment';

/**
 * Opening site links in the Android app from apps with their own browser (Discord, Snapchat, Instagram...).
 *
 * Android opens the app by itself for links it receives (App Links, see AndroidManifest.xml), but those
 * apps load the page in their in-app browser without asking Android. So the page, once loaded, hands
 * itself to the app with an intent:// link; if the app isn't installed, it comes back to the site with ?web=1.
 */

export const ANDROID_PACKAGE = 'com.missclick.sadikoi';
/** Added by the fallback (app not installed) and kept for the tab: the site stays in the browser. */
export const WEB_PARAM = 'web';
const WEB_KEY = 'sadikoi-web';

/** Pages the app opens: same list as the App Links in AndroidManifest.xml (legal pages stay on the web). */
export function isAppPath(path: string): boolean {
  return path === '/' || path.startsWith('/group/') || path.startsWith('/reset-password/');
}

/** Android browser on the real site (not the app itself, whose pages come from https://localhost). */
export function shouldOfferApp(location: Location = window.location, userAgent = navigator.userAgent): boolean {
  if (!/Android/i.test(userAgent) || location.origin !== environment.siteUrl) return false;
  if (new URLSearchParams(location.search).has(WEB_PARAM)) {
    rememberWeb();
    return false;
  }
  try {
    if (sessionStorage.getItem(WEB_KEY)) return false;
  } catch {
    // storage blocked: offer the app
  }
  return isAppPath(location.pathname);
}

/** The user chose the site (fallback, or closed the banner): don't offer the app again in this tab. */
export function rememberWeb(): void {
  try {
    sessionStorage.setItem(WEB_KEY, '1');
  } catch {
    // storage blocked: the banner may come back on the next page load
  }
}

/** intent:// link opening this page in the app, or the site with ?web=1 if the app isn't installed. */
export function appIntentUrl(location: Pick<Location, 'host' | 'pathname' | 'search'> = window.location): string {
  const params = new URLSearchParams(location.search);
  params.delete(WEB_PARAM);
  const query = params.toString() ? `?${params}` : '';
  params.set(WEB_PARAM, '1');
  const fallback = `https://${location.host}${location.pathname}?${params}`;
  return `intent://${location.host}${location.pathname}${query}`
    + `#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

/**
 * Tries to open the app right away. Resolves once the site should start: at once if the app isn't offered,
 * after the user comes back if the app opened (the page went to the background), or after a short wait if the
 * browser blocked it (some only allow it after a tap: the banner then offers a button).
 * Not starting the site behind the app avoids doing things twice (e.g. joining a group from both).
 */
export function openInAppBeforeStart(waitMs = 1200): Promise<void> {
  if (!shouldOfferApp()) return Promise.resolve();
  window.location.replace(appIntentUrl());
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      if (document.visibilityState === 'visible') done();
    }, waitMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') done();
    };
    const done = () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      resolve();
    };
    document.addEventListener('visibilitychange', onVisibility);
  });
}
