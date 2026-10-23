import { inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

/**
 * Mobile app only: when Android opens the app from a site link (an invitation, a password reset email...),
 * show the matching page instead of the home page.
 */
@Injectable({
  providedIn: 'root',
})
export class DeepLinkService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggerService);
  private readonly siteHost = new URL(environment.siteUrl).host;

  public init(): void {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // The app was already running.
    App.addListener('appUrlOpen', ({ url }) => this.open(url));
    // The app was closed and the link launched it.
    App.getLaunchUrl().then(launch => {
      if (launch?.url) {
        this.open(launch.url);
      }
    });
  }

  private open(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      this.logger.error('Ignored invalid deep link:', url);
      return;
    }
    // Only our own site's links: Android only sends those, but the URL comes from outside the app.
    if (parsed.host !== this.siteHost) {
      this.logger.error('Ignored deep link to another site:', url);
      return;
    }
    const path = parsed.pathname + parsed.search + parsed.hash;
    this.ngZone.run(() => this.router.navigateByUrl(path));
  }
}
