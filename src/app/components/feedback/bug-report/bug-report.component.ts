import { Component, inject, output } from '@angular/core';
import { FeedbackService } from '../../../services/feedback/feedback.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bug-report',
  imports: [TranslatePipe],
  templateUrl: './bug-report.component.html',
  styleUrl: './bug-report.component.css',
})
export class BugReportComponent {
  readonly feedbackService = inject(FeedbackService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly submitted = output<void>();

  protected async submitBugReport(title: string, description: string) {
    if (!title.trim() || !description.trim()) {
      return;
    }
    const result = await this.feedbackService.submitBugReport(title, description);
    if (result === null) {
      this.notifications.showError(this.translate.instant('notification.genericError'));
      return;
    }
    this.notifications.showSuccess(this.translate.instant('notification.feedbackSent'));
    this.submitted.emit();
  }
}
