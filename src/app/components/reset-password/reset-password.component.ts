import { Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormField, TranslatePipe, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';

  protected readonly submitting = signal(false);
  protected readonly model = signal({ password: '', confirmPassword: '' });
  protected readonly resetForm = form(this.model);

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const { password, confirmPassword } = this.model();
    if (!password || this.submitting()) return;
    if (password !== confirmPassword) {
      this.notificationService.showError(this.translate.instant('notification.passwordsMismatch'));
      return;
    }

    this.submitting.set(true);
    const success = await this.authService.resetPassword(this.token, password, confirmPassword);
    this.submitting.set(false);
    if (success) {
      this.notificationService.showSuccess(this.translate.instant('notification.passwordReset'));
      this.router.navigate(['/auth']);
    }
  }
}
