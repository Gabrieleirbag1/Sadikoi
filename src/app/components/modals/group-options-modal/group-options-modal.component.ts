import { ChangeDetectionStrategy, Component, inject, model, OnChanges, signal, SimpleChanges } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { LoggerService } from '../../../services/logger/logger.service';
import { GroupsService } from '../../../services/groups/groups.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ModalConfig, ModalService } from '../../../services/modal/modal.service';
import { DatetimeService } from '../../../services/datetime/datetime.service';
import { UserProfileComponent } from '../../tooltips/user-profile/user-profile.component';
import { UserProfileService } from '../../../services/user-profile/user-profile.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-group-options-modal',
  imports: [FormField, DatePipe, TranslatePipe, UserProfileComponent, ModalComponent],
  templateUrl: './group-options-modal.component.html',
  styleUrls: ['./group-options-modal.component.css', '../../tooltips/user-profile/user-profile-tooltip.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupOptionsComponent implements OnChanges {
  private readonly modalService = inject(ModalService);
  private readonly datetimeService = inject(DatetimeService);
  private readonly logger = inject(LoggerService);
  private readonly groupService = inject(GroupsService);
  protected readonly userProfileService = inject(UserProfileService);
  protected readonly tooltipScope = 'group-options-modal';
  protected connectedUser: User | null = null;
  private readonly modalId = 'group-options-modal';
  protected readonly removeUserConfirmId = 'remove-user-confirm';

  protected isOpen(): boolean {
    return this.modalService.isOpen(this.modalId);
  }

  protected config(): ModalConfig {
    return this.modalService.config(this.modalId);
  }

  public readonly group = model<Group | null>(null);
  protected groupModel = signal({ name: '', description: '', daily_reset_timestamp: '' });
  protected groupForm = form(this.groupModel);

  async ngOnInit(): Promise<void> {
    this.connectedUser = JSON.parse(localStorage.getItem('user') || '{}');
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const g = this.group();
    if (changes['group'] && g) {
      this.groupModel.set({
        name: g.name ?? '',
        description: g.description ?? '',
        daily_reset_timestamp: this.datetimeService.convertUTCTimeStampToLocal(g.daily_reset_timestamp ?? ''),
      });
    }
  }

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close(this.modalId);
    discardFn?.(event);
  }

  protected save(event: Event): void {
    const saveFn = this.config().save;
    this.modalService.close(this.modalId);
    saveFn?.(event);
  }

  protected async updateGroup(event: Event): Promise<void> {
    event.preventDefault();
    const val = this.groupModel();
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not defined');
      const timestamp = this.datetimeService.convertLocalTimestampToUtc(val.daily_reset_timestamp);
      const response = await this.groupService.updateGroup(g.id, val.name, val.description, timestamp);
      this.group.set(response);
    } catch (error) {
      this.logger.error('Error updating group:', error);
    }
  }

  protected confirmRemoveUser(user: User): void {
    const isSelf = user.id === this.connectedUser?.id;
    this.modalService.open(this.removeUserConfirmId, {
      title: isSelf ? 'Leave Group' : 'Remove User',
      description: isSelf
        ? 'Are you sure you want to leave this group?'
        : `Are you sure you want to remove ${user.username} from the group?`,
      save: () => this.removeUser(user),
    });
  }

  protected async removeUser(user: User): Promise<void> {
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not defined');
      const response = await this.groupService.removeUserFromGroup(g.id, user.id);
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