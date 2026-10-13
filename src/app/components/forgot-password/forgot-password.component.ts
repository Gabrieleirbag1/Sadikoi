import { Component, inject, signal, viewChild } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth/auth.service';
import { CaptchaComponent } from '../captcha/captcha.component';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormField, TranslatePipe, RouterLink, CaptchaComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly model = signal({ email: '' });
  protected readonly forgotForm = form(this.model);
  protected readonly captchaToken = signal<string | null>(null);
  private readonly captcha = viewChild(CaptchaComponent);

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const email = this.model().email.trim();
    if (!email || !this.captchaToken() || this.submitting()) return;

    this.submitting.set(true);
    const success = await this.authService.forgotPassword(email, this.captchaToken());
    this.submitting.set(false);
    if (!success) {
      // Tokens are single-use: get a fresh one for the next attempt.
      this.captcha()?.reset();
    } else {
      this.notificationService.showSuccess(this.translate.instant('notification.resetEmailSent'));
      this.router.navigate(['/auth']);
    }
  }
}
