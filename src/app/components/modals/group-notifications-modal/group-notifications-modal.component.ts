import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { GroupNotificationSettingsComponent } from '../../group-notification-settings/group-notification-settings.component';

/** The group's notification switches, opened from the bell button next to the calendar. Closes once saved. */
@Component({
  selector: 'app-group-notifications-modal',
  imports: [TranslatePipe, GroupNotificationSettingsComponent],
  templateUrl: './group-notifications-modal.component.html',
  styleUrl: './group-notifications-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupNotificationsModalComponent {
  public readonly groupId = input.required<number>();
  public readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }
}
