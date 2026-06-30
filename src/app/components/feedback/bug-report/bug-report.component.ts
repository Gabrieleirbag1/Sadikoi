import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../../services/feedback/feedback.service';

@Component({
  selector: 'app-bug-report',
  imports: [],
  templateUrl: './bug-report.component.html',
  styleUrl: './bug-report.component.css',
})
export class BugReportComponent {
  readonly feedbackService = inject(FeedbackService);

  protected async submitBugReport(title: string, description: string) {
    await this.feedbackService.submitBugReport(title, description);
  }
}
