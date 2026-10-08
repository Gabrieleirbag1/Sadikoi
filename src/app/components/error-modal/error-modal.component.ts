import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrl: './error-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorModalComponent {
  private readonly notificationService = inject(NotificationService);

  protected readonly toasts = this.notificationService.toasts;

  protected dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
