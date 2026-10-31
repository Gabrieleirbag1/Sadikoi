import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { GroupsService } from '../../services/groups/groups.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../../services/logger/logger.service';
import { clearPostLoginRedirect, savePostLoginRedirect } from '../../utils/post-login-redirect';

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
  private readonly route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    // An expired session (401) sends the user to the login page: the invitation is kept for after it.
    savePostLoginRedirect(`/group/invitations/${encodeURIComponent(token)}`);
    try {
      const response = await this.groupsService.answerGroupInvitation(token);
      clearPostLoginRedirect();
      if (response) this.router.navigate(['/group', response.id], { state: { group: response } });
    } catch (error) {
      this.logger.error('Error joining group:', error);
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return; // the auth interceptor already opened the login page
      }
      clearPostLoginRedirect(); // invalid or expired invitation: don't try again after the next login
      this.router.navigate(['/']);
    }
  }

}
