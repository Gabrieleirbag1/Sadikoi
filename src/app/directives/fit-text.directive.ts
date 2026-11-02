import { afterRenderEffect, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Shrinks the element's font size until its text fits on `maxLines` lines.
 * Starts from the size the stylesheet gives (so media queries still set the largest size).
 * The text is never cut: below `minFontSize` it stops shrinking and takes the extra lines it needs.
 * The element must be a block (or a flex item) with a numeric `line-height`.
 */
@Directive({
  selector: '[appFitText]',
  host: { class: 'fit-text' },
})
export class FitTextDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The text: fitting runs again whenever it changes. */
  public readonly appFitText = input<string | null | undefined>();
  public readonly maxLines = input(2);
  /** Smallest font size in px (only an extremely long text goes past `maxLines` at this size). */
  public readonly minFontSize = input(11);

  constructor() {
    afterRenderEffect(() => {
      this.appFitText();
      this.fit();
    });

    const refit = () => this.fit();
    window.addEventListener('resize', refit);
    // The web font changes the text's width once loaded (`ready` may resolve before it even starts loading).
    document.fonts?.ready.then(refit);
    document.fonts?.addEventListener('loadingdone', refit);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', refit);
      document.fonts?.removeEventListener('loadingdone', refit);
    });
  }

  private fit(): void {
    const el = this.host.nativeElement;
    // Measure without the previous fit: stylesheet size.
    el.style.fontSize = '';

    const maxLines = this.maxLines();
    const style = getComputedStyle(el);
    let size = parseFloat(style.fontSize);
    // Browsers resolve a unitless line-height to px; jsdom keeps the number.
    const lineRatio = style.lineHeight.endsWith('px') ? parseFloat(style.lineHeight) / size : parseFloat(style.lineHeight);
    if (!size || !lineRatio) return; // not rendered (hidden, or tests)

    // offsetHeight = lines × line height (scrollHeight would also count glyphs drawn past the line height).
    const fits = () => el.offsetHeight <= Math.ceil(size * lineRatio * maxLines) + 1;
    while (!fits() && size > this.minFontSize()) {
      size = Math.max(this.minFontSize(), size - 1);
      el.style.fontSize = `${size}px`;
    }
  }
}
