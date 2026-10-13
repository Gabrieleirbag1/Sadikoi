import { Component, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { GoogleLoginComponent } from '../google-login/google-login.component';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { CaptchaComponent } from '../captcha/captcha.component';

type DisplayMode = 'register' | 'login' | 'verifyDevice';

@Component({
  selector: 'app-auth',
  imports: [GoogleLoginComponent, FormField, TranslatePipe, RouterLink, CaptchaComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isAuthenticated = this.authService.isAuthenticated();
  protected displayMode = signal<DisplayMode>('login');

  protected authModel = signal({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    login: true,
    remember: false
  });

  protected authForm = form(this.authModel);
  protected captchaToken = signal<string | null>(null);
  private readonly captcha = viewChild(CaptchaComponent);
    
  private selectedFile: File | null = null;

  protected handleFileSelected(file: File | null): void {
    this.selectedFile = file;
  }

  protected setDisplayMode(displayMode: DisplayMode): void {
    this.captchaToken.set(null);
    this.displayMode.set(displayMode);
  }

  protected async onSubmit(event: Event, mode: DisplayMode): Promise<void> {
    event.preventDefault();
    if (!this.captchaToken()) {
      return;
    }
    try {
      if (mode === 'register') {
        await this.register();
      } else {
        await this.login();
      }
    } finally {
      // Tokens are single-use: get a fresh one if the user stays on the form.
      this.captcha()?.reset();
    }
  }

  private async register(): Promise<void> {
    const val = this.authModel();
    if (val.password !== val.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    const response = await this.authService.register(val.username, val.password, val.confirmPassword, val.email, this.selectedFile, val.login, this.captchaToken());
    if (response && response.body) {
      if (val.login) {
        if (response.status === 203) {
          this.setDisplayMode('verifyDevice');
        }
      }
      else {
        this.setDisplayMode('login'); 
      }
    }
  }

  private async login(): Promise<void> {
    const val = this.authModel();
    const response = await this.authService.login(val.username, val.password, val.remember, this.captchaToken());
    if (response && response.body) {
      if (response.body.success) {
        if (response.status === 203) {
          this.setDisplayMode('verifyDevice');
        } else {
          this.isAuthenticated = true;
          this.router.navigate(['/']);
        }
      }
    }
  }

  protected logout(forgetDevice: boolean): void {
    this.authService.logout(forgetDevice);
    this.isAuthenticated = false;
    sessionStorage.removeItem('homeState');
  }

  protected onDigitInput(current: HTMLInputElement, next: HTMLInputElement | null) {
    current.value = current.value.replace(/[^0-9]/g, '').slice(-1);
    if (current.value && next) {
      next.focus();
    }
  }

  protected onKeydown(event: KeyboardEvent, current: HTMLInputElement, prev: HTMLInputElement | null) {
    if (event.key === 'Backspace' && !current.value && prev) {
      prev.focus();
    }
  }

  protected onPaste(event: ClipboardEvent, inputs: HTMLInputElement[]) {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') || '').replace(/[^0-9]/g, '');
    if (!digits) return;
    inputs.forEach((input, i) => (input.value = digits[i] || ''));
    const lastIndex = Math.min(digits.length, inputs.length) - 1;
    if (lastIndex >= 0) inputs[lastIndex].focus();
  }

  protected async verifyDevice(code: string): Promise<void> {
    const val = this.authModel();
    const success = await this.authService.verifyDevice(val.username, code);
    if (success) {
      this.login();
    }
  }

  protected async askForNewCode(): Promise<void> {
    const val = this.authModel();
    if (!this.captchaToken()) {
      return;
    }
    await this.authService.login(val.username, val.password, val.remember, this.captchaToken());
    this.captcha()?.reset();
  }
}
