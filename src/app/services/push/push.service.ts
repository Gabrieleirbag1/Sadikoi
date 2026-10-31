import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, PushNotificationSchema } from '@capacitor/push-notifications';
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
  { id: 'answers', nameKey: 'notificationSettings.answers' },
];

/** Tags of a group's notifications (API, notifications.py): opening the group clears them all. */
const GROUP_TAG_PREFIXES = ['chat', 'answers', 'question'];
const groupTags = (groupId: number) => GROUP_TAG_PREFIXES.map(prefix => `${prefix}-${groupId}`);

/** Stable numeric id for a tag ("chat-12"): a new notification with the same tag replaces the previous one. */
function notificationId(tag: string): number {
  let hash = 0;
  for (const char of tag) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
}

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
    // Tapped notification: open its group.
    await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      this.openRoute(notification.data?.route);
    });
    // Received while the app is open (the plugin shows nothing, see capacitor.config.ts).
    await PushNotifications.addListener('pushNotificationReceived', notification => {
      this.showWhileOpen(notification);
    });
    await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      this.openRoute(notification.extra?.route);
    });
    // Back in the app on a group's page (e.g. a notification of the group already open was tapped, which
    // doesn't reload the page): what arrived meanwhile has been seen.
    await App.addListener('resume', () => {
      const groupId = this.router.url.match(/^\/group\/(\d+)(?:[/?#]|$)/)?.[1];
      if (groupId) this.clearGroupNotifications(Number(groupId));
    });
  }

  /** The group's page is open: its notifications (chat, answers, question, reminder) leave the tray. */
  public async clearGroupNotifications(groupId: number): Promise<void> {
    if (!this.available) {
      return;
    }
    const tags = groupTags(groupId);
    try {
      // Shown by Firebase (app closed or in the background): tagged by the API.
      const { notifications } = await PushNotifications.getDeliveredNotifications();
      const delivered = notifications.filter(n => n.tag && tags.includes(n.tag));
      if (delivered.length) {
        await PushNotifications.removeDeliveredNotifications({ notifications: delivered });
      }
      // Shown by showWhileOpen (app open on another page): their id comes from the same tags.
      await LocalNotifications.removeDeliveredNotificationsById({ ids: tags.map(notificationId) });
    } catch (error) {
      this.logger.error('Failed to clear the group notifications:', error);
    }
  }

  /** The API only sends paths of the app ("/group/12"). */
  private openRoute(route: unknown): void {
    if (typeof route === 'string' && route.startsWith('/')) {
      this.ngZone.run(() => this.router.navigateByUrl(route));
    }
  }

  /** Nothing if the notification's page is on screen (e.g. that group is open), otherwise the usual banner. */
  private async showWhileOpen(notification: PushNotificationSchema): Promise<void> {
    const data = notification.data ?? {};
    const route = typeof data.route === 'string' ? data.route : '';
    const currentPath = this.router.url.split(/[?#]/)[0];
    if (route && (currentPath === route || currentPath.startsWith(`${route}/`))) {
      return;
    }
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId(data.tag ?? notification.id ?? `${Date.now()}`),
          title: notification.title ?? '',
          body: notification.body ?? '',
          channelId: data.channel,
          extra: { route },
        }],
      });
    } catch (error) {
      this.logger.error('Failed to show a notification:', error);
    }
  }

  private async createChannels(): Promise<void> {
    for (const channel of CHANNELS) {
      const name = await firstValueFrom(this.translate.get(channel.nameKey));
      // Importance 4 (high): sound and a banner on screen.
      await PushNotifications.createChannel({ id: channel.id, name, importance: 4 });
    }
  }
}
