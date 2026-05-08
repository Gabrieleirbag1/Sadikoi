import { Component, inject, OnInit, signal } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groups',
  imports: [CommonModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css',
  standalone: true
})
export class GroupsComponent implements OnInit {

  private readonly groupsService = inject(GroupsService);
  protected groups = signal<Group[]>([]);

  async ngOnInit(): Promise<void> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    await this.fetchGroups(user.id);
  }

  protected async fetchGroups(userId: number): Promise<void> {
    try {
      const groups = await this.groupsService.getGroups(userId);
      if (groups) this.groups.set(groups);
      console.log('Fetched groups:', this.groups());
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }

  protected async createGroup(groupName: string): Promise<void> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const newGroup = await this.groupsService.createGroup(groupName, user.id);
      if (newGroup) this.groups.update(current => [...current, newGroup]);
      console.log('Created group:', newGroup);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }


}
