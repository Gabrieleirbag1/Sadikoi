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

  public async joinGroup(groupCode: string): Promise<void> {
    this.logger.debug('Joining group with code:', groupCode);
    try {
      const response = await this.groupsService.answerGroupInvitation(groupCode);
      this.logger.debug('Join group response:', response);
      if (response) this.router.navigate(['/group', response.id], { state: { group: response } });
    } catch (error) {
      this.logger.error('Error joining group:', error);
      this.router.navigate(['/groups']);
    }
  }
}
