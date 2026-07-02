import { Component, inject, OnInit, signal } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger/logger.service';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';
import { ModalService } from '../../services/modal/modal.service';
import { GroupModalComponent } from '../modals/group-modal/group-modal.component';

type ViewState = 'grid' | 'list';

@Component({
  selector: 'app-groups',
  imports: [CommonModule, ProfileImagePickerComponent, GroupModalComponent],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css',
  standalone: true
})
export class GroupsComponent implements OnInit {
  private readonly logger = inject(LoggerService)
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
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

  protected async createGroup(groupName: string, groupDescription: string, groupTime: string): Promise<void> {
    try {
      const newGroup = await this.groupsService.createGroup(groupName, groupDescription, groupTime);
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

  protected openGroupModal() {
    this.modalService.open({
      title: '',
      description: '',
      save: (data: { name: string; description: string; time: string }) => 
        this.createGroup(data.name, data.description, data.time),
      discard: () => console.log('cancelled'),
    });
  }

}
