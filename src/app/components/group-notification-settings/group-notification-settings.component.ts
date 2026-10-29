import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PushService } from '../../services/push/push.service';

type Setting = keyof NotificationSettings;

/** One group's push notification switches, each saved as soon as it is changed. */
@Component({
  selector: 'app-group-notification-settings',
  imports: [TranslatePipe],
  templateUrl: './group-notification-settings.component.html',
  styleUrl: './group-notification-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNotificationSettingsComponent {
  private readonly api = inject(NotificationSettingsService);
  private readonly toasts = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  protected readonly push = inject(PushService);

  public readonly groupId = input.required<number>();

  protected readonly state = signal<GroupNotificationSettings | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly options: { name: Setting; label: string }[] = [
    { name: 'messages', label: 'notificationSettings.messages' },
    { name: 'questions', label: 'notificationSettings.questions' },
    { name: 'vote_reminder', label: 'notificationSettings.voteReminder' },
    { name: 'answers', label: 'notificationSettings.answers' },
  ];

  constructor() {
    effect(() => {
      this.load(this.groupId());
    });
  }

  private async load(groupId: number): Promise<void> {
    this.state.set(null);
    this.loadFailed.set(false);
    const settings = await this.api.getGroupSettings(groupId);
    // Ignore a late answer if another group was opened meanwhile.
    if (groupId !== this.groupId()) return;
    this.state.set(settings);
    this.loadFailed.set(!settings);
  }

  protected async toggle(name: Setting, value: boolean): Promise<void> {
    const before = this.state();
    if (!before) return;
    const groupId = this.groupId();
    this.state.set({ ...before, group: { ...before.group, [name]: value } });
    const result = await this.api.saveGroupSettings(groupId, { [name]: value });
    if (groupId !== this.groupId()) return;
    if (result) {
      this.state.set(result);
    } else {
      this.state.set(before);
      this.toasts.showError(this.translate.instant('notificationSettings.saveFailed'));
    }
  }
}
