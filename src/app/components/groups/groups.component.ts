import { Component, inject, OnInit, signal } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger/logger.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';

type ViewState = 'grid' | 'list';

@Component({
  selector: 'app-groups',
  imports: [CommonModule, TranslatePipe, ProfileImagePickerComponent],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css',
  standalone: true
})
export class GroupsComponent implements OnInit {
  private readonly logger = inject(LoggerService)
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);
  protected groups = signal<Group[]>([]);
  protected view: ViewState = 'grid';

  async ngOnInit(): Promise<void> {
    await this.fetchGroups();
    this.changeView(localStorage.getItem('groupsView') as ViewState || 'grid');
  }

  protected async fetchGroups(): Promise<void> {
    try {
      const groups = await this.groupsService.getGroups();
      if (groups) this.groups.set(groups);
      this.logger.debug('Fetched groups:', this.groups());
    } catch (error) {
      this.logger.error('Error fetching groups:', error);
    }
  }

  protected async createGroup(groupName: string): Promise<void> {
    try {
      const newGroup = await this.groupsService.createGroup(groupName);
      if (newGroup) this.groups.update(current => [...current, newGroup]);
      this.logger.debug('Created group:', newGroup);
    } catch (error) {
      this.logger.error('Error creating group:', error);
    }
  }

  protected redirectGroup(group: Group): void {
    this.router.navigate([`/group/${group.id}`], { state: { group } });
  }

  protected changeView(view: ViewState): void {
    localStorage.setItem('groupsView', view);
    this.view = view;
  }

}
