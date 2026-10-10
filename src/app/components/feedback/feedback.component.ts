import { Component, HostListener, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings/settings.service';
import { BugReportComponent } from './bug-report/bug-report.component';
import { SuggestionComponent } from './suggestion/suggestion.component';

type FeedbackMode = 'bugReport' | 'suggestion';

@Component({
  selector: 'app-feedback',
  imports: [BugReportComponent, SuggestionComponent, TranslatePipe],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
})
export class FeedbackComponent {
  protected readonly settings = inject(SettingsService);
  protected readonly mode = signal<FeedbackMode>('bugReport');

  protected close(): void {
    this.settings.closeFeedback();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}
