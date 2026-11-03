import { deviceLanguage, startupLanguage, toSupportedLanguage } from './language';

describe('language', () => {
  afterEach(() => localStorage.removeItem('user'));

  it('keeps the primary subtag of a supported language', () => {
    expect(toSupportedLanguage('fr-FR')).toBe('fr');
    expect(toSupportedLanguage('EN-us')).toBe('en');
    expect(toSupportedLanguage('de-DE')).toBeNull();
    expect(toSupportedLanguage(undefined)).toBeNull();
  });

  it('picks the first supported device language', () => {
    expect(deviceLanguage(['fr-FR', 'en-US'])).toBe('fr');
    expect(deviceLanguage(['de-DE', 'fr-CA', 'en'])).toBe('fr');
  });

  it('falls back to English', () => {
    expect(deviceLanguage(['de-DE', 'es'])).toBe('en');
    expect(deviceLanguage([])).toBe('en');
  });

  it("starts with the saved user's language", () => {
    localStorage.setItem('user', JSON.stringify({ language: 'fr' }));
    expect(startupLanguage()).toBe('fr');
  });

  it('ignores a saved user without a supported language', () => {
    localStorage.setItem('user', JSON.stringify({ language: 'de' }));
    expect(startupLanguage()).toBe(deviceLanguage());
    localStorage.setItem('user', '{broken');
    expect(startupLanguage()).toBe(deviceLanguage());
  });
});
