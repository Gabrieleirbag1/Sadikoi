import { Component, computed, inject, output, signal } from '@angular/core';
import { FeedbackService } from '../../../services/feedback/feedback.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BUG_CATEGORIES, BugCategory, OTHER_CATEGORY } from '../../../services/feedback/feedback-categories';

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

  protected readonly categories = BUG_CATEGORIES;
  protected readonly selectedCategory = signal<BugCategory>(BUG_CATEGORIES[0]);
  protected readonly title = signal('');
  protected readonly isOther = computed(() => this.selectedCategory() === OTHER_CATEGORY);

  protected onCategoryChange(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value as BugCategory);
  }

  protected onTitleInput(event: Event): void {
    this.title.set((event.target as HTMLInputElement).value);
  }

  protected async submitBugReport(description: string) {
    // A preset category is the title: only "other" needs one typed by the user.
    const customTitle = this.isOther() ? this.title().trim() : '';
    if (!description.trim() || (this.isOther() && !customTitle)) {
      return;
    }
    const sent = await this.feedbackService.submitBugReport(this.selectedCategory(), customTitle, description);
    if (!sent) {
      this.notifications.showError(this.translate.instant('notification.genericError'));
      return;
    }
    this.notifications.showSuccess(this.translate.instant('notification.feedbackSent'));
    this.submitted.emit();
  }
}
