import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProfileImagePickerComponent } from "../../profile-image-picker/profile-image-picker.component";

import { ItemImageDisplayComponent } from '../../item-image-display/item-image-display.component';
import { ReportUserService } from '../../../services/report-user/report-user.service';
import { BlockUserService } from '../../../services/block-user/block-user.service';
import { NotificationService } from '../../../services/notification/notification.service';

const MAX_VISIBLE_ITEMS = 4;

@Component({
  selector: 'app-user-profile',
  imports: [ProfileImagePickerComponent, ItemImageDisplayComponent, TranslatePipe, DatePipe],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  private readonly reportUserService = inject(ReportUserService);
  private readonly blockUserService = inject(BlockUserService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly connectedUser: User | null = JSON.parse(localStorage.getItem('user') || 'null');

  public readonly user = input<User | null>(null);
  public readonly group = input<Group | null>(null);
  protected readonly expanded = signal(false);

  protected readonly items = computed(() => this.user()?.items ?? []);
  protected readonly visibleItems = computed(() =>
    this.expanded() ? this.items() : this.items().slice(0, MAX_VISIBLE_ITEMS)
  );
  protected readonly hiddenCount = computed(() => Math.max(0, this.items().length - MAX_VISIBLE_ITEMS));

  protected readonly canReport = computed(() => {
    const user = this.user();
    return !!user && user.id !== this.connectedUser?.id;
  });

  // My own block wins: if we blocked each other, I can still unblock.
  protected readonly isBlocked = computed(() => this.blockUserService.blocked().has(this.user()?.id ?? -1));
  protected readonly hasBlockedMe = computed(() =>
    !this.isBlocked() && this.blockUserService.blockedBy().has(this.user()?.id ?? -1)
  );
  protected readonly unblocking = signal(false);

  protected reportUser(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    const groupId = this.group()?.id ?? undefined;
    this.reportUserService.open(user, undefined, groupId);
  }

  /** Blocking asks for a confirmation (modal in app.html). */
  protected blockUser(): void {
    const user = this.user();
    if (user) {
      this.blockUserService.open(user);
    }
  }

  /** Unblocking applies right away. */
  protected async unblockUser(): Promise<void> {
    const user = this.user();
    if (!user || this.unblocking()) {
      return;
    }
    this.unblocking.set(true);
    const success = await this.blockUserService.unblock(user);
    this.unblocking.set(false);
    if (success) {
      this.notifications.showSuccess(this.translate.instant('notification.userUnblocked'));
    } else {
      this.notifications.showError(this.translate.instant('notification.genericError'));
    }
  }

  protected toggleExpanded(): void {
    this.expanded.update(value => !value);
  }
}
