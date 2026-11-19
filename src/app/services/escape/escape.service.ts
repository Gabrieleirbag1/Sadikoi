import { DestroyRef, effect, inject, Injectable } from '@angular/core';

/**
 * Escape closes the popup on top (the last opened), and only it: a confirmation over the group options,
 * the picture preview over a profile card... Each popup registers while it is open (see closeOnEscape).
 */
@Injectable({ providedIn: 'root' })
export class EscapeService {
  private readonly layers: (() => void)[] = [];

  constructor() {
    const onKeydown = (event: KeyboardEvent) => {
      // Already handled (the chat's "@" suggestions close themselves first).
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      const close = this.layers.at(-1);
      if (!close) return;
      event.preventDefault();
      close();
    };
    document.addEventListener('keydown', onKeydown);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', onKeydown));
  }

  /** `close` runs on Escape while it is the last one added. Returns the function removing it. */
  public add(close: () => void): () => void {
    this.layers.push(close);
    return () => {
      const index = this.layers.lastIndexOf(close);
      if (index !== -1) this.layers.splice(index, 1);
    };
  }
}

/**
 * Escape runs `close` while `isOpen()` (a signal read) is true: above the popups opened before. Without
 * `isOpen`, for as long as the component exists (popups shown with an @if). Call in an injection context.
 */
export function closeOnEscape(close: () => void, isOpen: () => boolean = () => true): void {
  const escape = inject(EscapeService);
  effect(onCleanup => {
    if (isOpen()) onCleanup(escape.add(close));
  });
}
