import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { GroupNotificationSettingsComponent } from '../../group-notification-settings/group-notification-settings.component';
import { closeOnEscape } from '../../../services/escape/escape.service';

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

  constructor() {
    // Shown with an @if: Escape closes it as long as it exists.
    closeOnEscape(() => this.close());
  }

  protected close(): void {
    this.closed.emit();
  }
}
