/**
 * Resolves once a third-party widget (Google button, Turnstile...) has rendered inside `container`:
 * when its iframe has loaded or, if the iframe is not reachable (shadow DOM), once the container
 * has taken its size. Call it before rendering the widget so the iframe insertion isn't missed.
 */
export function waitForIframe(container: HTMLElement, timeoutMs = 4000): Promise<void> {
  return new Promise(resolve => {
    const cleanups: (() => void)[] = [];
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      cleanups.forEach(cleanup => cleanup());
      resolve();
    };

    const watchIframe = (iframe: HTMLIFrameElement) => {
      iframe.addEventListener('load', done, { once: true });
      iframe.addEventListener('error', done, { once: true });
    };

    const existing = container.querySelector('iframe');
    if (existing) watchIframe(existing);

    const mutations = new MutationObserver(() => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        mutations.disconnect();
        watchIframe(iframe);
      }
    });
    mutations.observe(container, { childList: true, subtree: true });
    cleanups.push(() => mutations.disconnect());

    // Fallback when the iframe is hidden in a shadow root: wait for the widget to take its size.
    let sizeTimer: ReturnType<typeof setTimeout> | undefined;
    const sizes = new ResizeObserver(() => {
      if (container.offsetHeight > 0 && !sizeTimer && !container.querySelector('iframe')) {
        sizeTimer = setTimeout(done, 500);
      }
    });
    sizes.observe(container);
    cleanups.push(() => sizes.disconnect(), () => clearTimeout(sizeTimer));

    const timeout = setTimeout(done, timeoutMs);
    cleanups.push(() => clearTimeout(timeout));
  });
}
