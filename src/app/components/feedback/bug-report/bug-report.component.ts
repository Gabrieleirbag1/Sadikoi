import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../../services/feedback/feedback.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-bug-report',
  imports: [TranslatePipe],
  templateUrl: './bug-report.component.html',
  styleUrl: './bug-report.component.css',
})
export class BugReportComponent {
  readonly feedbackService = inject(FeedbackService);

  protected async submitBugReport(title: string, description: string) {
    await this.feedbackService.submitBugReport(title, description);
  }
}
