import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
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

  // The real question themes, the ones the API accepts (plus "other").
  private readonly themes = signal<ThemeOption[]>([]);
  private readonly lang = toSignal(this.translate.onLangChange.pipe(map(event => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? 'en',
  });
  protected readonly options = computed(() => [
    ...this.themes().map(theme => ({ id: theme.id, label: this.lang() === 'fr' ? theme.fr : theme.en })),
    { id: OTHER_CATEGORY, label: null }, // translated in the template
  ]);
  protected readonly selectedTheme = signal<string>(OTHER_CATEGORY);

  async ngOnInit(): Promise<void> {
    try {
      const themes = await firstValueFrom(
        this.httpClient.get<Record<string, ThemeOption>>('/data/question_themes.json')
      );
      const options = Object.values(themes);
      this.themes.set(options);
      this.selectedTheme.set(options[0]?.id ?? OTHER_CATEGORY);
    } catch (error) {
      this.logger.error('Error loading question themes:', error);
    }
  }

  protected async submitSuggestion(question: string) {
    if (!question.trim()) {
      return;
    }
    const sent = await this.feedbackService.submitSuggestion(this.selectedTheme(), question);
    if (!sent) {
      this.notifications.showError(this.translate.instant('notification.genericError'));
      return;
    }
    this.notifications.showSuccess(this.translate.instant('notification.feedbackSent'));
    this.submitted.emit();
  }
}
