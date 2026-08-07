import { Component, inject, model, OnChanges, signal, SimpleChanges } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { LoggerService } from '../../../services/logger/logger.service';
import { GroupsService } from '../../../services/groups/groups.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ModalService } from '../../../services/modal/modal.service';

@Component({
  selector: 'app-group-options-modal',
  imports: [FormField, DatePipe, TranslatePipe],
  templateUrl: './group-options-modal.component.html',
  styleUrl: './group-options-modal.component.css',
})
export class GroupOptionsComponent implements OnChanges {
  private readonly modalService = inject(ModalService);
  private readonly logger = inject(LoggerService);
  private readonly groupService = inject(GroupsService);

  public readonly isOpen = this.modalService.isOpen;
  public readonly config = this.modalService.config;

  public readonly group = model<Group | null>(null); 
  protected groupModel = signal({ name: '', description: '', daily_reset_timestamp: '' });
  protected groupForm = form(this.groupModel);

  public ngOnChanges(changes: SimpleChanges): void {
    const g = this.group();
    if (changes['group'] && g) {
      this.groupModel.set({
        name: g.name ?? '',
        description: g.description ?? '',
        daily_reset_timestamp: this.convertResetTimeStampToLocalTimezone(g.daily_reset_timestamp ?? ''),
      });
    }
  }

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close();
    discardFn?.(event);
  }

  protected save(event: Event): void {
    const saveFn = this.config().save;
    this.modalService.close();
    saveFn?.(event);
  }

  protected async updateGroup(event: Event): Promise<void> {
    event.preventDefault();
    const val = this.groupModel();
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not defined');
      const timestamp = this.convertLocalTimestampToUtc(val.daily_reset_timestamp);
      const response = await this.groupService.updateGroup(g.id, val.name, val.description, timestamp);
      this.group.set(response);
    } catch (error) {
      this.logger.error('Error updating group:', error);
    }
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

  private convertResetTimeStampToLocalTimezone(time: string): string {
    const [hours, minutes, seconds = '00'] = time.split(':');
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes), Number(seconds)));

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private convertLocalTimestampToUtc(time: string): string {
    const [hours, minutes] = time.split(':');
    const now = new Date();

    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes));

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

}