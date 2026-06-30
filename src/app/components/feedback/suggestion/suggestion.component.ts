import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../../services/feedback/feedback.service';

@Component({
  selector: 'app-suggestion',
  imports: [],
  templateUrl: './suggestion.component.html',
  styleUrl: './suggestion.component.css',
})
export class SuggestionComponent {
  readonly feedbackService = inject(FeedbackService);

  protected async submitSuggestion(theme: string, question: string) {
    await this.feedbackService.submitSuggestion(theme, question);
  }
}
