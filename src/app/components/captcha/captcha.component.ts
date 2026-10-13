import { Component, ElementRef, NgZone, OnDestroy, OnInit, inject, output, viewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../../services/logger/logger.service';

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
})
export class CaptchaComponent implements OnInit, OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private widgetId: string | null = null;

  /** Emits the token once solved, or null when it expires / errors. */
  readonly tokenChange = output<string | null>();

  async ngOnInit(): Promise<void> {
    try {
      await loadTurnstileScript();
    } catch (error) {
      this.logger.error('Captcha unavailable:', error);
      return;
    }
    this.widgetId = turnstile.render(this.container().nativeElement, {
      sitekey: environment.turnstileSiteKey,
      callback: (token: string) => this.ngZone.run(() => this.tokenChange.emit(token)),
      'expired-callback': () => this.ngZone.run(() => this.tokenChange.emit(null)),
      'error-callback': () => this.ngZone.run(() => this.tokenChange.emit(null)),
    });
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
