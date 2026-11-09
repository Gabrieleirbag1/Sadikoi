const NBSP = ' ';

/**
 * French punctuation stays on the same line as its word: the space before ? ! : ; » (and after «)
 * becomes a non-breaking one. "qui craque en premier ?" never ends with "?" alone on the last line.
 */
export function keepPunctuationAttached(text: string): string {
  return text
    .replace(/[ \t ]+([?!:;»])/g, `${NBSP}$1`)
    .replace(/«[ \t ]+/g, `«${NBSP}`);
}
