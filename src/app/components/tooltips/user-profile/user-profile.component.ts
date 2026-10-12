import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileImagePickerComponent } from "../../profile-image-picker/profile-image-picker.component";

import { ItemImageDisplayComponent } from '../../item-image-display/item-image-display.component';
import { ReportUserService } from '../../../services/report-user/report-user.service';
import { UserProfileService } from '../../../services/user-profile/user-profile.service';

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
  private readonly userProfileService = inject(UserProfileService);
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

  protected reportUser(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    this.userProfileService.close();
    this.reportUserService.open(user);
  }

  protected toggleExpanded(): void {
    this.expanded.update(value => !value);
  }
}
