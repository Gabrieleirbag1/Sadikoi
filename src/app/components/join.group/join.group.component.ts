import { Component, inject } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join.group',
  imports: [],
  templateUrl: './join.group.component.html',
  styleUrl: './join.group.component.css',
})
export class JoinGroupComponent {
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);

  public async joinGroup(groupCode: string): Promise<void> {
    console.log('Joining group with code:', groupCode);
    try {
      const response = await this.groupsService.answerGroupInvitation(groupCode);
      console.log('Join group response:', response);
      if (response) this.router.navigate(['/group', response.id], { state: { group: response } });
    } catch (error) {
      console.error('Error joining group:', error);
      this.router.navigate(['/groups']);
    }
  }
}
