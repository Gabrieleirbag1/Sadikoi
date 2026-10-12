import { ChangeDetectionStrategy, Component, effect, HostListener, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { ReportUserService } from '../../../services/report-user/report-user.service';

const MAX_REASON_LENGTH = 500;

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
  protected readonly reason = signal('');
  protected readonly submitting = signal(false);

  public constructor() {
    // start every report with an empty form
    effect(() => {
      this.reportUserService.target();
      this.reason.set('');
    });
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.reportUserService.close();
  }

  protected onInput(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  protected async submit(): Promise<void> {
    const target = this.reportUserService.target();
    if (!target || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const reason = [target.context, this.reason().trim()].filter(Boolean).join(' ');
    const success = await this.authService.reportUser(target.user.id, reason);
    this.submitting.set(false);
    if (success) {
      this.notifications.showSuccess(this.translate.instant('notification.userReported'));
      this.close();
    } else {
      this.notifications.showError(this.translate.instant('notification.genericError'));
    }
  }
}
