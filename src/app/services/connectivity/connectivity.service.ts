import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

/** ok, no network at all, a network that doesn't get through, or our server down while the internet works. */
export type ConnectionStatus = 'ok' | 'offline' | 'poor' | 'server';

const PROBE_TIMEOUT_MS = 5000;
const RECHECK_EVERY_MS = 10_000;
/** Answers 204 to anyone (Android uses it for the same check): reachable = the internet works. */
const INTERNET_PROBE_URL = 'https://www.google.com/generate_204';
/** What the reverse proxy answers when the API behind it is down. */
export const GATEWAY_ERRORS = new Set([502, 503, 504]);

/**
 * Decides whether the app can reach the API. While it can't, the page is replaced by an error screen
 * (<app-connection-error>) instead of showing empty or outdated content, and the check runs again until it works.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly logger = inject(LoggerService);

  readonly status = signal<ConnectionStatus>('ok');
  /** A check is running (the retry button shows it). */
  readonly checking = signal(false);

  private pending: Promise<ConnectionStatus> | null = null;
  private recheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    window.addEventListener('offline', () => this.setStatus('offline'));
    window.addEventListener('online', () => this.recheckIfDown());
    if (Capacitor.isNativePlatform()) {
      App.addListener('resume', () => this.recheckIfDown());
    }
  }

  /** An API request failed at the network level. Resolves to true if the problem is confirmed (error screen shown). */
  async reportFailure(): Promise<boolean> {
    return (await this.check()) !== 'ok';
  }

  /** An API request got an answer. */
  reportSuccess(): void {
    if (this.status() !== 'ok') this.setStatus('ok');
  }

  /** The retry button. */
  retry(): Promise<ConnectionStatus> {
    return this.check();
  }

  /** One check at a time: concurrent failures share it. */
  private check(): Promise<ConnectionStatus> {
    if (!this.pending) {
      this.checking.set(true);
      this.pending = this.diagnose()
        .then(status => {
          this.setStatus(status);
          return status;
        })
        .finally(() => {
          this.pending = null;
          this.checking.set(false);
        });
    }
    return this.pending;
  }

  private async diagnose(): Promise<ConnectionStatus> {
    if (!navigator.onLine) return 'offline';
    if (await this.apiReachable()) return 'ok';
    return (await this.internetReachable()) ? 'server' : 'poor';
  }

  /** Any answer from the API itself (even a 404) means it is up; a proxy error means it is down. */
  private async apiReachable(): Promise<boolean> {
    try {
      const response = await withTimeout(signal => fetch(environment.apiUrl, { credentials: 'omit', cache: 'no-store', signal }));
      return !GATEWAY_ERRORS.has(response.status);
    } catch {
      return false;
    }
  }

  private async internetReachable(): Promise<boolean> {
    try {
      // no-cors: the answer can't be read, but getting one at all is the proof.
      await withTimeout(signal => fetch(INTERNET_PROBE_URL, { mode: 'no-cors', cache: 'no-store', signal }));
      return true;
    } catch {
      return false;
    }
  }

  private recheckIfDown(): void {
    if (this.status() !== 'ok') this.check();
  }

  private setStatus(status: ConnectionStatus): void {
    if (status !== this.status()) {
      this.logger.info('Connection status:', status);
      this.status.set(status);
    }
    if (status === 'ok') {
      if (this.recheckTimer !== null) clearInterval(this.recheckTimer);
      this.recheckTimer = null;
    } else {
      this.recheckTimer ??= setInterval(() => this.check(), RECHECK_EVERY_MS);
    }
  }
}

/** fetch with a deadline (a poor connection can hang for a long time instead of failing). */
function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>, ms = PROBE_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  return new Promise<T>((resolve, reject) => {
    // Rejects on its own too, in case the (native) fetch ignores the abort signal.
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, ms);
    request(controller.signal).then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
