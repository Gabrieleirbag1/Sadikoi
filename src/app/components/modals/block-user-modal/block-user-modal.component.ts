import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUserService } from '../../../services/block-user/block-user.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { closeOnEscape } from '../../../services/escape/escape.service';

/** Asks before blocking someone. Unblocking needs no confirmation (see the profile card). */
@Component({
  selector: 'app-block-user-modal',
  imports: [TranslatePipe],
  templateUrl: './block-user-modal.component.html',
  // Same look as the report modal, also opened from the profile card.
  styleUrls: ['../report-user-modal/report-user-modal.component.css', './block-user-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockUserModalComponent {
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  protected readonly blockUserService = inject(BlockUserService);
  protected readonly submitting = signal(false);

  public constructor() {
    closeOnEscape(() => this.close(), () => !!this.blockUserService.target());
  }

  protected close(): void {
    this.blockUserService.close();
  }

  protected async confirm(): Promise<void> {
    const user = this.blockUserService.target();
    if (!user || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const success = await this.blockUserService.block(user);
    this.submitting.set(false);
    if (success) {
      this.notifications.showSuccess(this.translate.instant('notification.userBlocked'));
      this.close();
    } else {
      this.notifications.showError(this.translate.instant('notification.genericError'));
    }
  }
}
