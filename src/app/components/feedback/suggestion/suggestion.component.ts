import { Component, inject, output } from '@angular/core';
import { FeedbackService } from '../../../services/feedback/feedback.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-suggestion',
  imports: [TranslatePipe],
  templateUrl: './suggestion.component.html',
  styleUrl: './suggestion.component.css',
})
export class SuggestionComponent {
  readonly feedbackService = inject(FeedbackService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly submitted = output<void>();

  protected async submitSuggestion(theme: string, question: string) {
    if (!question.trim()) {
      return;
    }
    const result = await this.feedbackService.submitSuggestion(theme, question);
    if (result === null) {
      this.notifications.showError(this.translate.instant('notification.genericError'));
      return;
    }
    this.notifications.showSuccess(this.translate.instant('notification.feedbackSent'));
    this.submitted.emit();
  }
}
