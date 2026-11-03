import { Component, inject, OnInit, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { FeedbackService } from '../../../services/feedback/feedback.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { LoggerService } from '../../../services/logger/logger.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OTHER_CATEGORY } from '../../../services/feedback/feedback-categories';

interface ThemeOption {
  id: string;
  fr: string;
  en: string;
}

@Component({
  selector: 'app-suggestion',
  imports: [TranslatePipe],
  templateUrl: './suggestion.component.html',
  styleUrl: './suggestion.component.css',
})
export class SuggestionComponent implements OnInit {
  readonly feedbackService = inject(FeedbackService);
  private readonly httpClient = inject(HttpClient);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly logger = inject(LoggerService);

  readonly submitted = output<void>();

  protected readonly otherTheme = OTHER_CATEGORY;
  // The real question themes, the ones the API accepts (plus "other").
  protected readonly themes = signal<ThemeOption[]>([]);
  private readonly lang = toSignal(this.translate.onLangChange.pipe(map(event => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? 'en',
  });

  async ngOnInit(): Promise<void> {
    try {
      const themes = await firstValueFrom(
        this.httpClient.get<Record<string, ThemeOption>>('/data/question_themes.json')
      );
      this.themes.set(Object.values(themes));
    } catch (error) {
      this.logger.error('Error loading question themes:', error);
    }
  }

  protected label(theme: ThemeOption): string {
    return this.lang() === 'fr' ? theme.fr : theme.en;
  }

  protected async submitSuggestion(theme: string, question: string) {
    if (!question.trim()) {
      return;
    }
    const sent = await this.feedbackService.submitSuggestion(theme, question);
    if (!sent) {
      this.notifications.showError(this.translate.instant('notification.genericError'));
      return;
    }
    this.notifications.showSuccess(this.translate.instant('notification.feedbackSent'));
    this.submitted.emit();
  }
}
