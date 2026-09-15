import { Component, inject, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { GoogleLoginComponent } from '../google-login/google-login.component';
import { form, FormField } from '@angular/forms/signals';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth',
  imports: [GoogleLoginComponent, FormField, ProfileImagePickerComponent, TranslatePipe],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  @ViewChild(ProfileImagePickerComponent) imagePicker!: ProfileImagePickerComponent;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isAuthenticated = this.authService.isAuthenticated();
  protected displayMode = signal<'register' | 'login' | 'verifyDevice'>('login');

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

  protected setDisplayMode(displayMode: 'register' | 'login' | 'verifyDevice'): void {
    this.displayMode.set(displayMode);
  }

  protected async onSubmit(event: Event, mode: 'register' | 'login'): Promise<void> {
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
      if (this.imagePicker) {
        this.imagePicker.clearPreview();
      }
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
