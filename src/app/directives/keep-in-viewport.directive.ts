import { afterEveryRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Slides a floating element (profile card...) back inside the screen when its position would put part of
 * it outside, without resizing it. Uses the CSS `translate` property, which adds to the element's own
 * `transform` (the flip classes keep working). Runs after each render (the element may have moved),
 * when it changes size (pictures loading, "show more"), on scroll and on resize.
 */
@Directive({
  selector: '[appKeepInViewport]',
})
export class KeepInViewportDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Minimal space kept between the element and the edges of the screen, in px. */
  public readonly viewportMargin = input(8);
  private dx = 0;
  private dy = 0;

  constructor() {
    afterEveryRender({ read: () => this.fit() });

    const fit = () => this.fit();
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(this.el);
    window.addEventListener('resize', fit);
    window.addEventListener('scroll', fit, { capture: true, passive: true });
    window.visualViewport?.addEventListener('resize', fit);
    inject(DestroyRef).onDestroy(() => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', fit);
      window.removeEventListener('scroll', fit, { capture: true });
      window.visualViewport?.removeEventListener('resize', fit);
    });
  }

  private fit(): void {
    const rect = this.el.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    // Where the element would be without the current shift.
    const left = rect.left - this.dx, top = rect.top - this.dy;
    const margin = this.viewportMargin();
    const viewport = window.visualViewport;
    const minX = (viewport?.offsetLeft ?? 0) + margin;
    const minY = (viewport?.offsetTop ?? 0) + margin;
    const maxX = (viewport ? viewport.offsetLeft + viewport.width : document.documentElement.clientWidth) - margin;
    const maxY = (viewport ? viewport.offsetTop + viewport.height : window.innerHeight) - margin;

    // Pushed back from the right/bottom edge first; if it's bigger than the screen, the top/left stays visible.
    let dx = Math.min(0, maxX - (left + rect.width));
    dx = Math.max(dx, minX - left);
    let dy = Math.min(0, maxY - (top + rect.height));
    dy = Math.max(dy, minY - top);
    dx = Math.round(dx);
    dy = Math.round(dy);

    if (dx === this.dx && dy === this.dy) return;
    this.dx = dx;
    this.dy = dy;
    this.el.style.translate = dx || dy ? `${dx}px ${dy}px` : '';
  }
}
