import { Component, inject, OnInit, signal } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { QuestionComponent } from "../question/question.component";
import { LoggerService } from '../../services/logger/logger.service';

@Component({
  selector: 'app-group',
  imports: [QuestionComponent],
  templateUrl: './group.component.html',
  styleUrl: './group.component.css',
})
export class GroupComponent implements OnInit {
  private readonly logger = inject(LoggerService)
  private readonly groupsService = inject(GroupsService);
  protected group = signal<Group | null>(null);
  protected invitation = signal<string | null>(null);

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
      this.logger.error('Invalid group ID in URL');
    }
  }

  protected async fetchGroup(groupId: number): Promise<void> {
    try {
      const group = await this.groupsService.getGroup(groupId);
      if (group) this.group.set(group);
      this.logger.debug('Fetched group:', this.group());
    } catch (error) {
      this.logger.error('Error fetching group:', error);
    }
  }

  protected async fetchInvitation(): Promise<void> {
    if (!this.group()) {
      this.logger.error('Group not loaded yet');
      return;
    }
    try {
      const invitation = await this.groupsService.getGroupInvitation(this.group()!.id);
      this.logger.debug('Fetched group invitation:', invitation);
      this.invitation.set(invitation);
    } catch (error) {
      this.logger.error('Error fetching group invitation:', error);
    }
  }

}
