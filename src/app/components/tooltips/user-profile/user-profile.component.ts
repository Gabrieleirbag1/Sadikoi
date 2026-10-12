import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProfileImagePickerComponent } from "../../profile-image-picker/profile-image-picker.component";

import { ItemImageDisplayComponent } from '../../item-image-display/item-image-display.component';
import { AuthService } from '../../../services/auth/auth.service';
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
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly connectedUser: User | null = JSON.parse(localStorage.getItem('user') || 'null');

  public readonly user = input<User | null>(null);
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

  protected async reportUser(): Promise<void> {
    const user = this.user();
    if (!user) {
      return;
    }
    const reason = window.prompt(this.translate.instant('userProfile.reportPrompt', { username: user.username }));
    if (reason === null) {
      return;
    }
    const success = await this.authService.reportUser(user.id, reason.trim());
    if (success) {
      this.notifications.showSuccess(this.translate.instant('notification.userReported'));
    } else {
      this.notifications.showError(this.translate.instant('notification.genericError'));
    }
  }

  protected toggleExpanded(): void {
    this.expanded.update(value => !value);
  }
}
