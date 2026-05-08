import { Component, inject, OnInit, signal } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';

@Component({
  selector: 'app-group',
  imports: [],
  templateUrl: './group.component.html',
  styleUrl: './group.component.css',
})
export class GroupComponent implements OnInit {
  private readonly groupsService = inject(GroupsService);
  protected group = signal<Group | null>(null);

  async ngOnInit(): Promise<void> {
    const navState = window.history.state;
    if (navState && navState.group) {
      this.group.set(navState.group);
      return;
    }

    const groupIdUrl = window.location.pathname.split('/').pop();
    const groupId = groupIdUrl ? parseInt(groupIdUrl, 10) : null;
    if (groupId) {
      await this.fetchGroup(groupId);
    } else {
      console.error('Invalid group ID in URL');
    }
  }

  protected async fetchGroup(groupId: number): Promise<void> {
    try {
      const group = await this.groupsService.getGroup(groupId);
      if (group) this.group.set(group);
      console.log('Fetched group:', this.group());
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  }
}
