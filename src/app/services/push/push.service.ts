import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getDeviceId } from '../../utils/device-id';
import { LoggerService } from '../logger/logger.service';
import { NotificationSettingsService } from '../notification-settings/notification-settings.service';

/** Android notification channels: same ids as the API (notifications.py). */
const CHANNELS = [
  { id: 'messages', nameKey: 'notificationSettings.messages' },
  { id: 'questions', nameKey: 'notificationSettings.questions' },
  { id: 'reminders', nameKey: 'notificationSettings.voteReminder' },
];

export type PushPermission = 'granted' | 'denied' | 'unknown';

/**
 * Mobile app only: push notifications (Firebase).
 * - init(), at launch: opens the right page when a notification is tapped.
 * - start(), once logged in: asks for the permission and sends this phone's token to the API.
 */
@Injectable({
  providedIn: 'root',
})
export class PushService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggerService);
  private readonly translate = inject(TranslateService);
  private readonly settingsService = inject(NotificationSettingsService);

  /** False on the website, and in the app until Firebase is set up (see environment.pushNotificationsEnabled). */
  public readonly available = Capacitor.isNativePlatform() && environment.pushNotificationsEnabled;
  public readonly permission = signal<PushPermission>('unknown');
  private listenersReady: Promise<void> | null = null;
  private starting = false;

  public init(): void {
    if (!this.available) {
      return;
    }
    this.listenersReady ??= this.addListeners();
  }

  public async start(): Promise<void> {
    if (!this.available || this.starting) {
      return;
    }
    this.starting = true;
    try {
      this.init();
      await this.listenersReady;
      let status = await PushNotifications.checkPermissions();
      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
        status = await PushNotifications.requestPermissions();
      }
      this.permission.set(status.receive === 'granted' ? 'granted' : 'denied');
      if (status.receive === 'granted') {
        await this.createChannels();
        // Fires 'registration' with the token, every time (so it is sent again after a new login).
        await PushNotifications.register();
      }
    } catch (error) {
      this.logger.error('Push notifications setup failed:', error);
    } finally {
      this.starting = false;
    }
  }

  private async addListeners(): Promise<void> {
    await PushNotifications.addListener('registration', ({ value }) => {
      this.settingsService.registerDevice(value, getDeviceId(), Capacitor.getPlatform());
    });
    await PushNotifications.addListener('registrationError', error => {
      this.logger.error('Push registration failed:', error);
    });
    // Tapped notification: open its group. The API only sends paths of the app ("/group/12").
    await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const route = notification.data?.route;
      if (typeof route === 'string' && route.startsWith('/')) {
        this.ngZone.run(() => this.router.navigateByUrl(route));
      }
    });
  }

  private async createChannels(): Promise<void> {
    for (const channel of CHANNELS) {
      const name = await firstValueFrom(this.translate.get(channel.nameKey));
      // Importance 4 (high): sound and a banner on screen.
      await PushNotifications.createChannel({ id: channel.id, name, importance: 4 });
    }
  }
}
