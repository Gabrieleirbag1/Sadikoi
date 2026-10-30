import { environment } from '../../environments/environment';
import { appIntentUrl, isAppPath, shouldOfferApp } from './open-in-app';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const site = new URL(environment.siteUrl);

/** A Location on the real site (only the fields the helpers read). */
const at = (path: string, search = '') => ({ origin: site.origin, host: site.host, pathname: path, search }) as Location;

describe('open in app', () => {
  beforeEach(() => sessionStorage.clear());

  it('sends the app pages to the app, keeps legal pages and the API on the web', () => {
    for (const path of ['/', '/group/12', '/group/invitations/abc', '/reset-password/xyz']) {
      expect(isAppPath(path)).toBe(true);
    }
    for (const path of ['/privacy', '/terms', '/legal', '/delete-account', '/api/groups/', '/og-image.png']) {
      expect(isAppPath(path)).toBe(false);
    }
  });

  it('builds an intent:// link to the app, falling back to the site with ?web=1', () => {
    const url = appIntentUrl(at('/group/invitations/abc', '?lang=fr'));
    expect(url).toBe(
      `intent://${site.host}/group/invitations/abc?lang=fr#Intent;scheme=https;package=com.missclick.sadikoi;`
      + `S.browser_fallback_url=${encodeURIComponent(`https://${site.host}/group/invitations/abc?lang=fr&web=1`)};end`,
    );
    expect(appIntentUrl(at('/'))).toContain(`S.browser_fallback_url=${encodeURIComponent(`https://${site.host}/?web=1`)}`);
  });

  it('offers the app only in an Android browser, on the site, until the user picks the site', () => {
    expect(shouldOfferApp(at('/group/1'), ANDROID)).toBe(true);
    expect(shouldOfferApp(at('/group/1'), 'Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0')).toBe(false); // computer
    expect(shouldOfferApp({ ...at('/group/1'), origin: 'https://localhost' } as Location, ANDROID)).toBe(false); // the app itself
    expect(shouldOfferApp(at('/privacy'), ANDROID)).toBe(false);

    // Back from the fallback (app not installed): the site stays for the rest of the tab.
    expect(shouldOfferApp(at('/group/1', '?web=1'), ANDROID)).toBe(false);
    expect(shouldOfferApp(at('/'), ANDROID)).toBe(false);
  });
});
