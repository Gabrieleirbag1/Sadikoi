import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PushService } from '../../services/push/push.service';

type Setting = keyof NotificationSettings;

/** One group's push notification switches, saved together by the save button (one request). */
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

  /** What the user is editing; sent in one request by the save button. */
  protected readonly state = signal<GroupNotificationSettings | null>(null);
  /** What the server has (to know whether anything changed). */
  private readonly saved = signal<GroupNotificationSettings | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly dirty = computed(() => {
    const draft = this.state();
    const saved = this.saved();
    return !!draft && !!saved && JSON.stringify(draft.group) !== JSON.stringify(saved.group);
  });
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
    this.saved.set(null);
    this.loadFailed.set(false);
    const settings = await this.api.getGroupSettings(groupId);
    // Ignore a late answer if another group was opened meanwhile.
    if (groupId !== this.groupId()) return;
    this.state.set(settings);
    this.saved.set(settings);
    this.loadFailed.set(!settings);
  }

  protected toggle(name: Setting, value: boolean): void {
    const current = this.state();
    if (current) {
      this.state.set({ ...current, group: { ...current.group, [name]: value } });
    }
  }

  protected async save(): Promise<void> {
    const draft = this.state();
    if (!draft || !this.dirty() || this.saving()) return;
    const groupId = this.groupId();
    this.saving.set(true);
    const result = await this.api.saveGroupSettings(groupId, draft.group);
    this.saving.set(false);
    if (groupId !== this.groupId()) return;
    if (result) {
      this.state.set(result);
      this.saved.set(result);
      this.toasts.showSuccess(this.translate.instant('notificationSettings.saved'));
    } else {
      // The draft is kept so the user can retry.
      this.toasts.showError(this.translate.instant('notificationSettings.saveFailed'));
    }
  }
}
