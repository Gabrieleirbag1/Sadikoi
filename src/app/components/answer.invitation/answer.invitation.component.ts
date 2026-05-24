import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GroupsService } from '../../services/groups/groups.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../services/logger/logger.service';

@Component({
  selector: 'app-answer.invitation',
  imports: [CommonModule],
  templateUrl: './answer.invitation.component.html',
  styleUrl: './answer.invitation.component.css',
})
export class AnswerInvitationComponent implements OnInit {
  private readonly logger = inject(LoggerService)
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    try {
      const urlSegments = window.location.pathname.split('/');
      const token = urlSegments[urlSegments.length - 1];
      this.logger.debug('Token:', token);
      const response = await this.groupsService.answerGroupInvitation(token);
      if (response) this.router.navigate(['/group', response.id], { state: { group: response } });
    } catch (error) {
      this.logger.error('Error joining group:', error);
      this.router.navigate(['/groups']);
    }
  }
      
}
