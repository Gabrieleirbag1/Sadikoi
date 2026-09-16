import { Component, inject, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { GoogleLoginComponent } from '../google-login/google-login.component';
import { form, FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

type DisplayMode = 'register' | 'login' | 'verifyDevice';

@Component({
  selector: 'app-auth',
  imports: [GoogleLoginComponent, FormField, TranslatePipe],
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
    
  private selectedFile: File | null = null;

  protected handleFileSelected(file: File | null): void {
    this.selectedFile = file;
  }

  protected setDisplayMode(displayMode: DisplayMode): void {
    this.displayMode.set(displayMode);
  }

  protected async onSubmit(event: Event, mode: DisplayMode): Promise<void> {
    event.preventDefault();
    if (mode === 'register') {
      await this.register();
    } else {
      await this.login();
    }
  }

  private async register(): Promise<void> {
    const val = this.authModel();
    if (val.password !== val.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    const response = await this.authService.register(val.username, val.password, val.confirmPassword, val.email, this.selectedFile, val.login);
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
    const response = await this.authService.login(val.username, val.password, val.remember);
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
    await this.authService.login(val.username, val.password, val.remember);
  }
}
