import { MessagePart } from './mentions';

/** "http://…", "https://…" or "www.…", up to the next space. */
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
/** Punctuation ending a sentence is not part of the link ("voir https://a.fr." -> "https://a.fr"). */
const TRAILING = /[.,;:!?'’»)\]}]+$/;

/** The link without the punctuation that follows it; a ")" stays when the link has the matching "(" (Wikipedia). */
function trimLink(raw: string): string {
  let link = raw.replace(TRAILING, '');
  while (raw.length > link.length && raw[link.length] === ')' && link.split('(').length > link.split(')').length) {
    link += ')';
  }
  return link;
}

/**
 * Cuts the plain text parts of a message into text and links (`url` is what the link opens: "www.x.fr"
 * opens "https://www.x.fr"). Mentions are kept as they are. Only http(s) links: never "javascript:".
 */
export function splitLinks(parts: readonly MessagePart[]): MessagePart[] {
  const result: MessagePart[] = [];
  for (const part of parts) {
    if (part.user) {
      result.push(part);
      continue;
    }
    let textStart = 0;
    for (const match of part.text.matchAll(LINK)) {
      const text = trimLink(match[0]);
      // Nothing left after "https://" or "www." once the punctuation is cut: not a link.
      if (/^(?:https?:\/\/|www\.)$/i.test(text)) continue;
      const start = match.index;
      if (start > textStart) result.push({ text: part.text.slice(textStart, start) });
      result.push({ text, url: /^www\./i.test(text) ? `https://${text}` : text });
      textStart = start + text.length;
    }
    if (textStart < part.text.length) result.push({ text: part.text.slice(textStart) });
  }
  return result;
}
