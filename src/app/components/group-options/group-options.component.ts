import { Component, inject, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
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
  @Input() group: Group | null = null;

  protected groupModel = signal({ name: '', description: '' });
  protected groupForm = form(this.groupModel);

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['group'] && this.group) {
      this.groupModel.set({
        name: this.group.name ?? '',
        description: this.group.description ?? '',
      });
    }
  }

  protected async updateGroup(event: Event): Promise<void> {
    event.preventDefault();
    const val = this.groupModel();
    try {
      if (!this.group) throw new Error('Group is not defined');
      await this.groupService.updateGroup(this.group.id, val.name, val.description);
    } catch (error) {
      this.logger.error('Error updating group:', error);
    }
  }
}