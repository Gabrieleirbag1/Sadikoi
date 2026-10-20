import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom } from 'rxjs';

const BOOT_TIMEOUT_MS = 8000;
const IMAGES_TIMEOUT_MS = 5000;
/** Navigations faster than this never show the loader (avoids a flash on cached routes). */
const SHOW_DELAY_MS = 150;

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  private readonly navigationVisible = signal(false);
  private readonly pending = signal(0);

  /** Navigation loader (<app-loading>). The boot loader lives in index.html. */
  readonly visible = computed(() => this.navigationVisible() || this.pending() > 0);

  private booted = false;
  private initialized = false;
  private lastNavigationId = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  /** Manual loader, e.g. around a slow request. Each show() needs a matching hide(). */
  show(): void {
    this.pending.update(n => n + 1);
  }

  hide(): void {
    this.pending.update(n => Math.max(0, n - 1));
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.watchNavigations();
    this.waitForBoot().then(() => this.removeBootLoader());
  }

  private async waitForBoot(): Promise<void> {
    const ready = Promise.all([
      firstValueFrom(
        this.router.events.pipe(filter(e => e instanceof NavigationEnd || e instanceof NavigationError))
      ),
      firstValueFrom(this.translate.get('loading.label')),
      this.windowLoaded(),
      this.document.fonts?.ready ?? Promise.resolve(),
    ]).then(() => this.afterRender())
      .then(() => this.waitForImages(this.document.body));

    await Promise.race([ready, this.delay(BOOT_TIMEOUT_MS)]).catch(() => undefined);
  }

  private removeBootLoader(): void {
    this.booted = true;
    const loader = this.document.getElementById('boot-loader');
    if (!loader) return;
    const remove = () => loader.remove();
    loader.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 300);
    loader.classList.add('app-loader--hidden');
  }

  private watchNavigations(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.lastNavigationId = event.id;
        this.startNavigation();
      } else if (event instanceof NavigationEnd) {
        this.endNavigation(event.id, true);
      } else if (event instanceof NavigationCancel) {
        // Usually a guard redirect: the follow-up navigation starts right after, so keep the loader up.
        setTimeout(() => this.endNavigation(event.id, false));
      } else if (event instanceof NavigationError) {
        this.endNavigation(event.id, false);
      }
    });
  }

  private startNavigation(): void {
    if (!this.booted) return;
    if (this.navigationVisible() || this.showTimer) return;
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.navigationVisible.set(true);
    }, SHOW_DELAY_MS);
  }

  private endNavigation(id: number, waitForContent: boolean): void {
    if (id !== this.lastNavigationId) return; // a newer navigation took over

    if (this.showTimer) {
      // Fast navigation: the loader never appeared.
      clearTimeout(this.showTimer);
      this.showTimer = null;
      return;
    }
    if (!this.navigationVisible()) return;

    const content = waitForContent
      ? this.afterRender().then(() =>
          this.waitForImages(this.document.querySelector('.main-content') ?? this.document.body))
      : Promise.resolve();

    content.finally(() => {
      if (id === this.lastNavigationId) this.navigationVisible.set(false);
    });
  }

  private windowLoaded(): Promise<void> {
    if (this.document.readyState === 'complete') return Promise.resolve();
    return new Promise(resolve => window.addEventListener('load', () => resolve(), { once: true }));
  }

  /** Resolves once the pending render has been painted (timeout fallback: rAF is paused in background tabs). */
  private afterRender(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => setTimeout(resolve));
      setTimeout(resolve, 100);
    });
  }

  /** Waits for the eager images under `root` (lazy ones load on scroll and are skipped). */
  private waitForImages(root: ParentNode): Promise<void> {
    const images = Array.from(root.querySelectorAll('img')).filter(
      img => !img.complete && img.loading !== 'lazy'
    );
    if (images.length === 0) return Promise.resolve();

    const loaded = Promise.all(
      images.map(img => new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      }))
    ).then(() => undefined);

    return Promise.race([loaded, this.delay(IMAGES_TIMEOUT_MS)]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
