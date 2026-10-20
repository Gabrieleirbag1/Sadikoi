import { DOCUMENT, Injectable, Injector, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom } from 'rxjs';

/** Hard cap: the loader never stays longer than this, whatever is still pending. */
const MAX_LOADING_MS = 8000;
const IMAGES_TIMEOUT_MS = 5000;
/** Time without pending work before content is considered settled (catches chained requests). */
const QUIET_MS = 80;

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  // Router and TranslateService are resolved in init(): the HTTP interceptor injects this service,
  // and TranslateService itself makes HTTP requests (circular dependency otherwise).
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private router!: Router;
  private translate!: TranslateService;

  /** Navigation loader (<app-loading>). The boot loader lives in index.html. */
  readonly visible = signal(false);

  private booted = false;
  private initialized = false;
  private lastNavigationId = 0;
  private pendingTasks = 0;
  private idleWaiters: (() => void)[] = [];

  /**
   * Registers async work the loader must wait for (HTTP requests, third-party widgets...).
   * Returns the function to call once it is done. Only delays the boot/navigation loader:
   * it never shows the loader by itself.
   */
  begin(): () => void {
    this.pendingTasks++;
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      this.pendingTasks--;
      if (this.pendingTasks === 0) {
        const waiters = this.idleWaiters;
        this.idleWaiters = [];
        waiters.forEach(resolve => resolve());
      }
    };
  }

  /** Same as begin(), for a promise. */
  track<T>(work: Promise<T>): Promise<T> {
    const done = this.begin();
    work.then(done, done);
    return work;
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.router = this.injector.get(Router);
    this.translate = this.injector.get(TranslateService);
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
    ]).then(() => this.settle(this.document.body));

    await Promise.race([ready, this.delay(MAX_LOADING_MS)]).catch(() => undefined);
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
        // Shown right away: with a delay, the empty page would be visible before its data arrives.
        if (this.booted) this.visible.set(true);
      } else if (event instanceof NavigationEnd) {
        const content = this.settle(this.document.querySelector('.main-content') ?? this.document.body);
        Promise.race([content, this.delay(MAX_LOADING_MS)]).finally(() => this.endNavigation(event.id));
      } else if (event instanceof NavigationCancel) {
        // Usually a guard redirect: the follow-up navigation starts right after, so keep the loader up.
        setTimeout(() => this.endNavigation(event.id));
      } else if (event instanceof NavigationError) {
        this.endNavigation(event.id);
      }
    });
  }

  private endNavigation(id: number): void {
    if (id === this.lastNavigationId) this.visible.set(false);
  }

  /** Waits until pending work is over, the result is rendered and its images are loaded. */
  private async settle(root: ParentNode): Promise<void> {
    do {
      await this.whenIdle();
      await this.afterRender();
      await this.delay(QUIET_MS);
    } while (this.pendingTasks > 0);

    await this.waitForImages(root);
    await this.afterRender();
  }

  private whenIdle(): Promise<void> {
    if (this.pendingTasks === 0) return Promise.resolve();
    return new Promise(resolve => this.idleWaiters.push(resolve));
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
