import { ChangeDetectionStrategy, Component, computed, inject, input, model, OnChanges, signal, SimpleChanges } from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LoggerService } from '../../../services/logger/logger.service';
import { GroupsService } from '../../../services/groups/groups.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../services/notification/notification.service';
import { ModalConfig, ModalService } from '../../../services/modal/modal.service';
import { DatetimeService } from '../../../services/datetime/datetime.service';
import { UserProfileComponent } from '../../tooltips/user-profile/user-profile.component';
import { KeepInViewportDirective } from '../../../directives/keep-in-viewport.directive';
import { UserProfileService } from '../../../services/user-profile/user-profile.service';
import { ModalComponent } from '../modal/modal.component';
import { ProfileImagePickerComponent } from '../../profile-image-picker/profile-image-picker.component';
import { ThemesComponent } from '../../tooltips/themes/themes.component';
import { nextQuestionAt } from '../../../utils/reset-time';

@Component({
  selector: 'app-group-options-modal',
  imports: [FormField, DatePipe, TranslatePipe, UserProfileComponent, ModalComponent, ProfileImagePickerComponent, ThemesComponent, KeepInViewportDirective],
  templateUrl: './group-options-modal.component.html',
  styleUrls: ['./group-options-modal.component.css', '../../tooltips/user-profile/user-profile-tooltip.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupOptionsComponent implements OnChanges {
  private readonly modalService = inject(ModalService);
  private readonly datetimeService = inject(DatetimeService);
  private readonly logger = inject(LoggerService);
  private readonly groupService = inject(GroupsService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly modalId = 'group-options-modal';

  protected readonly userProfileService = inject(UserProfileService);
  protected readonly tooltipScope = 'group-options-modal';
  protected readonly removeUserConfirmId = 'remove-user-confirm';
  protected readonly resetDelayConfirmId = 'reset-delay-confirm';

  protected connectedUser: User | null = null;

  public readonly group = model<Group | null>(null);
  /** Current question of the group: tells until when it stays if the reset time changes. */
  public readonly question = input<Question | null>(null);
  protected groupModel = signal({ name: '', description: '', daily_reset_timestamp: '' });
  /** Reset time (local "HH:MM") as saved, to know when the field was changed. */
  private readonly savedResetTime = signal('');
  private readonly connectedUserId = signal<number | null>(null);
  protected readonly isAdmin = computed(() =>
    this.group()?.users.find(user => user.id === this.connectedUserId())?.role === 'admin'
  );
  // Only admins can edit the group: the fields are disabled (greyed out) for everyone else.
  protected groupForm = form(this.groupModel, path => {
    disabled(path.name, () => !this.isAdmin());
    disabled(path.description, () => !this.isAdmin());
    disabled(path.daily_reset_timestamp, () => !this.isAdmin());
  });
  protected selectedThemes: string[] = [];

  /**
   * A question stays at least 24 h (API): with a new reset time, the current question stays until this date,
   * then the new time applies. Null when the time isn't changed or there's no question to wait for.
   */
  protected readonly resetDelayUntil = computed(() => {
    const time = this.groupModel().daily_reset_timestamp;
    const date = this.question()?.date;
    if (!time || !date || time === this.savedResetTime()) return null;
    const next = nextQuestionAt(date, this.datetimeService.convertLocalTimestampToUtc(time));
    return next && next.getTime() > Date.now() ? next : null;
  });

  /** The delay in words, for the warning tooltip and the confirmation. */
  protected readonly resetDelayText = computed(() => {
    const until = this.resetDelayUntil();
    if (!until) return '';
    const date = until.toLocaleString(this.translate.getCurrentLang() || undefined, {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });
    return this.translate.instant('groupOptions.resetDelay', { date, time: this.groupModel().daily_reset_timestamp });
  });

  protected isOpen(): boolean {
    return this.modalService.isOpen(this.modalId);
  }

  protected config(): ModalConfig {
    return this.modalService.config(this.modalId);
  }

  async ngOnInit(): Promise<void> {
    this.connectedUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.connectedUserId.set(this.connectedUser?.id ?? null);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const g = this.group();
    if (changes['group'] && g) {
      const resetTime = this.datetimeService.convertUTCTimeStampToLocal(g.daily_reset_timestamp ?? '');
      this.groupModel.set({
        name: g.name ?? '',
        description: g.description ?? '',
        daily_reset_timestamp: resetTime,
      });
      this.savedResetTime.set(resetTime);
      this.selectedThemes = [...(g.themes ?? [])];
    }
  }

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close(this.modalId);
    discardFn?.(event);
  }

  protected save(event: Event): void {
    if (this.resetDelayUntil() && this.isAdmin()) {
      // Not sent yet (no form submit): the new time is confirmed first, knowing the current question stays.
      event.preventDefault();
      this.modalService.open(this.resetDelayConfirmId, {
        title: this.translate.instant('groupOptions.resetDelayTitle'),
        description: `${this.resetDelayText()} ${this.translate.instant('groupOptions.resetDelayConfirm')}`,
        save: () => {
          void this.submitGroup();
          this.close(event);
        },
      });
      return;
    }
    this.close(event);
  }

  private close(event: Event): void {
    const saveFn = this.config().save;
    this.modalService.close(this.modalId);
    saveFn?.(event);
  }

  protected async updateGroup(event: Event): Promise<void> {
    event.preventDefault();
    await this.submitGroup();
  }

  private async submitGroup(): Promise<void> {
    if (!this.isAdmin()) return;
    const val = this.groupModel();
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not defined');
      const timestamp = this.datetimeService.convertLocalTimestampToUtc(val.daily_reset_timestamp);
      const response = await this.groupService.updateGroup(g.id, val.name, val.description, timestamp, this.selectedThemes);
      this.group.set(response);
      this.savedResetTime.set(val.daily_reset_timestamp);
      this.notificationService.showSuccess(this.translate.instant('notification.groupUpdated'));
    } catch (error) {
      this.logger.error('Error updating group:', error);
    }
  }

  protected confirmRemoveUser(user: User): void {
    const isSelf = user.id === this.connectedUser?.id;
    // The last member leaving deletes the group (API): say so before.
    const lastMember = isSelf && (this.group()?.users.length ?? 0) <= 1;
    this.modalService.open(this.removeUserConfirmId, {
      title: isSelf ? this.translate.instant('groupOptions.leaveGroup') : 'Remove User',
      description: isSelf
        ? this.translate.instant(lastMember ? 'groupOptions.leaveLastMemberConfirm' : 'groupOptions.leaveConfirm')
        : `Are you sure you want to remove ${user.username} from the group?`,
      save: () => this.removeUser(user),
    });
  }

  protected async removeUser(user: User): Promise<void> {
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not defined');
      const response = await this.groupService.removeUserFromGroup(g.id, user.id);
      if (user.id === this.connectedUser?.id) {
        // No longer a member: back to the groups list.
        this.modalService.close(this.modalId);
        sessionStorage.setItem('homeState', 'groups');
        this.router.navigateByUrl('/', { replaceUrl: true });
        return;
      }
      this.group.set(response);
    } catch (error) {
      this.logger.error('Error removing user from group:', error);
    }
  }

  protected async promoteUser(user: User): Promise<void> {
    try {
      const group = this.group();
      if (!group) throw new Error('Group is not defined');
      const response = await this.groupService.promoteUserGroupRole(group.id, user.id);
      this.group.set(response);
    } catch (error) {
      this.logger.error('Error promoting user role:', error);
    }
  }

}