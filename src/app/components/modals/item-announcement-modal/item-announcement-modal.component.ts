import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ItemImageDisplayComponent } from '../../item-image-display/item-image-display.component';
import { ProfileImagePickerComponent } from '../../profile-image-picker/profile-image-picker.component';
import { closeOnEscape } from '../../../services/escape/escape.service';

/** Daily popup: who got, stole or kept yesterday's item, then every member with their items. */
@Component({
  selector: 'app-item-announcement-modal',
  imports: [TranslatePipe, ItemImageDisplayComponent, ProfileImagePickerComponent],
  templateUrl: './item-announcement-modal.component.html',
  styleUrl: './item-announcement-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemAnnouncementModalComponent {
  public readonly announcement = input.required<ItemAnnouncement>();
  public readonly closed = output<void>();

  protected readonly messageParams = computed(() => {
    const announcement = this.announcement();
    return {
      user: announcement.user.username,
      from: announcement.from_user?.username ?? '',
      streak: announcement.streak,
    };
  });

  constructor() {
    // Shown with an @if: Escape closes it as long as it exists.
    closeOnEscape(() => this.close());
  }

  protected close(): void {
    this.closed.emit();
  }
}
