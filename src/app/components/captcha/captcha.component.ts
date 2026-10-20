import { Component, ElementRef, NgZone, OnDestroy, OnInit, inject, output, viewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../../services/logger/logger.service';
import { LoadingService } from '../../services/loading/loading.service';
import { waitForIframe } from '../../services/loading/wait-for-iframe';

declare const turnstile: any;

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Failed to load Turnstile script'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

@Component({
  selector: 'app-captcha',
  template: '<div #container></div>',
  // Reserves the widget's height (300x65) so the page doesn't shift when it renders.
  styles: ':host { display: block; min-height: 65px; }',
})
export class CaptchaComponent implements OnInit, OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly loading = inject(LoadingService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private widgetId: string | null = null;

  /** Emits the token once solved, or null when it expires / errors. */
  readonly tokenChange = output<string | null>();

  ngOnInit(): void {
    // The loader stays up until the widget is displayed.
    this.loading.track(this.renderWidget());
  }

  private async renderWidget(): Promise<void> {
    try {
      await loadTurnstileScript();
    } catch (error) {
      this.logger.error('Captcha unavailable:', error);
      return;
    }
    const container = this.container().nativeElement;
    const rendered = waitForIframe(container);
    this.widgetId = turnstile.render(container, {
      sitekey: environment.turnstileSiteKey,
      callback: (token: string) => this.ngZone.run(() => this.tokenChange.emit(token)),
      'expired-callback': () => this.ngZone.run(() => this.tokenChange.emit(null)),
      'error-callback': () => this.ngZone.run(() => this.tokenChange.emit(null)),
    });
    await rendered;
  }

  /** Tokens are single-use: call after each submission to get a fresh one. */
  reset(): void {
    this.tokenChange.emit(null);
    if (this.widgetId !== null) {
      turnstile.reset(this.widgetId);
    }
  }

  ngOnDestroy(): void {
    if (this.widgetId !== null) {
      turnstile.remove(this.widgetId);
    }
  }
}
