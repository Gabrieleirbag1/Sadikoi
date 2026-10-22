/**
 * Copies text that is still being fetched (e.g. a link from the API), on desktop and mobile.
 *
 * 1. ClipboardItem with a promise: the copy is requested right away, during the click, which is
 *    what Safari (iOS) requires: it refuses clipboard writes made after awaiting a request.
 * 2. navigator.clipboard.writeText once the text is known (other browsers).
 * 3. A hidden textarea + execCommand('copy') when the Clipboard API is missing (non-HTTPS pages).
 *
 * Rejects with the fetch error if `text` rejects, or with an Error if every method fails.
 */
export async function copyToClipboard(text: Promise<string>): Promise<void> {
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      const blob = text.then(value => new Blob([value], { type: 'text/plain' }));
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      return;
    } catch {
      // Not supported here, or `text` failed: the next steps rethrow the fetch error if any.
    }
  }

  const value = await text;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Permission denied: try the legacy way.
    }
  }

  if (!copyWithTextarea(value)) {
    throw new Error('Clipboard unavailable');
  }
}

function copyWithTextarea(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
