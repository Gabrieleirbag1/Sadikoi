import { clearPostLoginRedirect, savePostLoginRedirect, takePostLoginRedirect } from './post-login-redirect';

describe('post-login redirect', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('gives the saved page back once', () => {
    savePostLoginRedirect('/group/invitations/abc');
    expect(takePostLoginRedirect()).toBe('/group/invitations/abc');
    expect(takePostLoginRedirect()).toBeNull();
  });

  it('ignores the home page and other sites', () => {
    savePostLoginRedirect('/');
    expect(takePostLoginRedirect()).toBeNull();
    savePostLoginRedirect('//evil.com/x');
    expect(takePostLoginRedirect()).toBeNull();
    savePostLoginRedirect('https://evil.com');
    expect(takePostLoginRedirect()).toBeNull();
  });

  it('forgets an old link', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    savePostLoginRedirect('/group/invitations/abc');
    vi.advanceTimersByTime(61 * 60 * 1000);
    expect(takePostLoginRedirect()).toBeNull();
  });

  it('can be cleared', () => {
    savePostLoginRedirect('/group/12');
    clearPostLoginRedirect();
    expect(takePostLoginRedirect()).toBeNull();
  });
});
