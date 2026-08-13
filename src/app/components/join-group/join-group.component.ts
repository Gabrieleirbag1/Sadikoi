import { Component, inject } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger/logger.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-join-group',
  imports: [TranslatePipe],
  templateUrl: './join-group.component.html',
  styleUrl: './join-group.component.css',
})
export class JoinGroupComponent {
  private readonly logger = inject(LoggerService)
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);

  private getGroupCode(groupCode: string): string {
    if (groupCode.includes('/')) {
      const url = new URL(groupCode);
      return url.pathname.split('/').pop() || '';
    }
    return groupCode;
  }

  public async joinGroup(groupCode: string): Promise<void> {
    const cleanedGroupCode = this.getGroupCode(groupCode);
    this.logger.debug('Joining group with code:', cleanedGroupCode);
    try {
      const response = await this.groupsService.answerGroupInvitation(cleanedGroupCode);
      this.logger.debug('Join group response:', response);
      if (response) this.router.navigate(['/group', response.id], { state: { group: response } });
    } catch (error) {
      this.logger.error('Error joining group:', error);
      this.router.navigate(['/groups']);
    }
  }
}
