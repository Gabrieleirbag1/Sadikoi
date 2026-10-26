import { Component, effect, HostListener, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings/settings.service';
import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PushService } from '../../services/push/push.service';

type GlobalSetting = 'messages' | 'questions' | 'vote_reminder';

/** Push notification preferences: three global switches, then one per group. Each change is saved at once. */
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

  protected readonly state = signal<NotificationSettings | null>(null);
  protected readonly loadFailed = signal(false);
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
    this.loadFailed.set(false);
    const settings = await this.api.getSettings();
    this.state.set(settings);
    this.loadFailed.set(!settings);
  }

  protected async toggleSetting(name: GlobalSetting, value: boolean): Promise<void> {
    this.patch(state => ({ ...state, [name]: value }));
    if (!(await this.api.updateSetting(name, value))) {
      this.patch(state => ({ ...state, [name]: !value }));
      this.showSaveError();
    }
  }

  protected async toggleGroup(group: NotificationGroupSetting, muted: boolean): Promise<void> {
    this.setGroupMuted(group.id, muted);
    if (!(await this.api.setGroupMuted(group.id, muted))) {
      this.setGroupMuted(group.id, !muted);
      this.showSaveError();
    }
  }

  private setGroupMuted(groupId: number, muted: boolean): void {
    this.patch(state => ({ ...state, groups: state.groups.map(g => (g.id === groupId ? { ...g, muted } : g)) }));
  }

  private patch(change: (state: NotificationSettings) => NotificationSettings): void {
    const current = this.state();
    if (current) {
      this.state.set(change(current));
    }
  }

  private showSaveError(): void {
    // HTTP errors already show a toast (error interceptor); this one is for the reverted checkbox.
    this.toasts.showError(this.translate.instant('notificationSettings.saveFailed'));
  }

  protected close(): void {
    this.settings.closeNotifications();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
