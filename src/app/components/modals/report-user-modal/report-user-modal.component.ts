import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { ReportUserService } from '../../../services/report-user/report-user.service';
import { OTHER_CATEGORY, REPORT_CATEGORIES, ReportCategory } from '../../../services/feedback/feedback-categories';

const MAX_REASON_LENGTH = 200;

@Component({
  selector: 'app-report-user-modal',
  imports: [TranslatePipe],
  templateUrl: './report-user-modal.component.html',
  styleUrl: './report-user-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportUserModalComponent {
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  protected readonly reportUserService = inject(ReportUserService);

  protected readonly maxLength = MAX_REASON_LENGTH;
  protected readonly categories = REPORT_CATEGORIES;
  protected readonly category = signal<ReportCategory>(REPORT_CATEGORIES[0]);
  protected readonly reason = signal('');
  // "other" means none of the categories fit: the user has to say why.
  protected readonly isOther = computed(() => this.category() === OTHER_CATEGORY);
  protected readonly canSubmit = computed(() => !this.isOther() || this.reason().trim().length > 0);
  protected readonly submitting = signal(false);

  public constructor() {
    // start every report with an empty form
    effect(() => {
      this.reportUserService.target();
      this.category.set(REPORT_CATEGORIES[0]);
      this.reason.set('');
    });
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.reportUserService.close();
  }

  protected onCategoryChange(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value as ReportCategory);
  }

  protected onInput(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  protected async submit(): Promise<void> {
    const target = this.reportUserService.target();
    if (!target || this.submitting() || !this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    const reason = this.reason().trim();
    const success = await this.authService.reportUser(target.user.id, this.category(), reason, target.groupId ?? null, target.messageId ?? null);
    this.submitting.set(false);
    if (success) {
      this.notifications.showSuccess(this.translate.instant('notification.userReported'));
      this.close();
    } else {
      this.notifications.showError(this.translate.instant('notification.genericError'));
    }
  }
}
