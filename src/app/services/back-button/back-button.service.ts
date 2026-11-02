import { inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { backAction } from '../../utils/back-button';

/**
 * Mobile app only: Android's back button. From a group it always goes home (see backAction),
 * instead of the previous page, which may be another group when the group was opened from a notification.
 */
@Injectable({
  providedIn: 'root',
})
export class BackButtonService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  public init(): void {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // Listening replaces Capacitor's default behaviour (history back, or leave the app).
    App.addListener('backButton', ({ canGoBack }) => this.ngZone.run(() => this.onBack(canGoBack)));
  }

  private onBack(canGoBack: boolean): void {
    switch (backAction(this.router.url, canGoBack)) {
      case 'home':
        // Same as the footer's home button: the groups list, not the profile we may have left the group for.
        sessionStorage.removeItem('pendingGroupId');
        sessionStorage.setItem('homeState', 'groups');
        this.router.navigateByUrl('/', { replaceUrl: true });
        break;
      case 'history':
        window.history.back();
        break;
      case 'minimize':
        App.minimizeApp();
        break;
    }
  }
}
