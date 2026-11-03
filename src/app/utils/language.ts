export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'fr'];
export const DEFAULT_LANGUAGE: Language = 'en';

/** "fr-FR" -> "fr"; null if the app has no translation for it. */
export function toSupportedLanguage(value: string | null | undefined): Language | null {
  const primary = value?.split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.find(language => language === primary) ?? null;
}

/** The first browser / phone language the app supports, in the user's order of preference, else English. */
export function deviceLanguage(languages: readonly string[] = navigator.languages ?? [navigator.language]): Language {
  for (const language of languages) {
    const supported = toSupportedLanguage(language);
    if (supported) return supported;
  }
  return DEFAULT_LANGUAGE;
}

/** The language to start with: the logged in user's one (saved from last time), else the device's. */
export function startupLanguage(): Language {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null') as { language?: string } | null;
    return toSupportedLanguage(user?.language) ?? deviceLanguage();
  } catch {
    return deviceLanguage();
  }
}
