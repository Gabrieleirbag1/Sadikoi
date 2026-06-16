import { Component, inject, Input, model, OnChanges, signal, SimpleChanges } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { GroupsService } from '../../services/groups/groups.service';

@Component({
  selector: 'app-group-options',
  imports: [FormField, DatePipe],
  templateUrl: './group-options.component.html',
  styleUrl: './group-options.component.css',
})
export class GroupOptionsComponent implements OnChanges {
  private readonly logger = inject(LoggerService);
  private readonly groupService = inject(GroupsService);
  readonly group = model<Group | null>(null); 

  protected groupModel = signal({ name: '', description: '', daily_reset_timestamp: '' });
  protected groupForm = form(this.groupModel);

  public ngOnChanges(changes: SimpleChanges): void {
    const g = this.group();
    if (changes['group'] && g) {
      this.groupModel.set({
        name: g.name ?? '',
        description: g.description ?? '',
        daily_reset_timestamp: g.daily_reset_timestamp ?? '',
      });
    }
  }

  protected async updateGroup(event: Event): Promise<void> {
    event.preventDefault();
    const val = this.groupModel();
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not defined');
      const response = await this.groupService.updateGroup(g.id, val.name, val.description, val.daily_reset_timestamp);
      this.group.set(response);
    } catch (error) {
      this.logger.error('Error updating group:', error);
    }
  }
}