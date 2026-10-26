import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings/settings.service';
import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PushService } from '../../services/push/push.service';

type GlobalSetting = 'messages' | 'questions' | 'vote_reminder';

/** Push notification preferences: three global switches, then one per group, saved together by the save button. */
@Component({
  selector: 'app-notification-settings',
  imports: [TranslatePipe],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.css',
})
export class NotificationSettingsComponent {
  protected readonly settings = inject(SettingsService);
  protected readonly push = inject(PushService);
  private readonly api = inject(NotificationSettingsService);
  private readonly toasts = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  /** What the user is editing; sent in one request by the save button. */
  protected readonly state = signal<NotificationSettings | null>(null);
  /** What the server has (to know whether anything changed). */
  private readonly saved = signal<NotificationSettings | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly dirty = computed(() => {
    const draft = this.state();
    const saved = this.saved();
    return !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);
  });
  protected readonly options: { name: GlobalSetting; label: string }[] = [
    { name: 'messages', label: 'notificationSettings.messages' },
    { name: 'questions', label: 'notificationSettings.questions' },
    { name: 'vote_reminder', label: 'notificationSettings.voteReminder' },
  ];

  constructor() {
    // Reload each time the window opens (groups may have changed).
    effect(() => {
      if (this.settings.notificationsOpen()) {
        this.load();
      }
    });
  }

  private async load(): Promise<void> {
    this.state.set(null);
    this.saved.set(null);
    this.loadFailed.set(false);
    const settings = await this.api.getSettings();
    this.state.set(settings);
    this.saved.set(settings);
    this.loadFailed.set(!settings);
  }

  protected toggleSetting(name: GlobalSetting, value: boolean): void {
    this.patch(state => ({ ...state, [name]: value }));
  }

  protected toggleGroup(group: NotificationGroupSetting, muted: boolean): void {
    this.patch(state => ({ ...state, groups: state.groups.map(g => (g.id === group.id ? { ...g, muted } : g)) }));
  }

  private patch(change: (state: NotificationSettings) => NotificationSettings): void {
    const current = this.state();
    if (current) {
      this.state.set(change(current));
    }
  }

  protected async save(): Promise<void> {
    const draft = this.state();
    if (!draft || !this.dirty() || this.saving()) {
      return;
    }
    this.saving.set(true);
    const result = await this.api.saveSettings(draft);
    this.saving.set(false);
    if (result) {
      this.state.set(result);
      this.saved.set(result);
      this.toasts.showSuccess(this.translate.instant('notificationSettings.saved'));
      this.close();
    } else {
      // The draft is kept so the user can retry. HTTP errors already show a toast (error interceptor).
      this.toasts.showError(this.translate.instant('notificationSettings.saveFailed'));
    }
  }

  protected close(): void {
    this.settings.closeNotifications();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
