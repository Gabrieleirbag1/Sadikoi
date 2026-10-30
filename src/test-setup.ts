// jsdom doesn't implement matchMedia.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// The Google Identity script is loaded from index.html, so it's missing in tests.
(globalThis as any).google ??= {
  accounts: {
    id: {
      initialize: () => {},
      renderButton: () => {},
      prompt: () => {},
    },
  },
};

// jsdom has no ResizeObserver: elements never resize there anyway.
(globalThis as any).ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};
