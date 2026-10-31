/**
 * Page to open once logged in, e.g. an invitation link clicked while logged out (Discord...): after
 * signing up or logging in, the user still joins the group.
 * Kept in localStorage (not sessionStorage) so it survives the app being closed while checking the
 * device verification email, but only for a while: an old link must not open on a later login.
 */
const KEY = 'post-login-redirect';
const TTL_MS = 60 * 60 * 1000;

export function savePostLoginRedirect(url: string): void {
  // Only pages of the app ("/group/invitations/abc"), never another site ("//evil.com").
  if (!url.startsWith('/') || url.startsWith('//') || url === '/') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ url, at: Date.now() }));
  } catch {
    // storage unavailable: the user lands on the home page after logging in
  }
}

/** The saved page, if still fresh; it is forgotten either way. */
export function takePostLoginRedirect(): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    localStorage.removeItem(KEY);
    if (saved && typeof saved.url === 'string' && saved.url.startsWith('/') && !saved.url.startsWith('//')
        && Date.now() - saved.at < TTL_MS) {
      return saved.url;
    }
  } catch {
    // unreadable or unavailable storage
  }
  return null;
}

export function clearPostLoginRedirect(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
}
