import { Component, inject, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { GoogleLoginComponent } from '../google-login/google-login.component';
import { form, FormField } from '@angular/forms/signals';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';

@Component({
  selector: 'app-auth',
  imports: [GoogleLoginComponent, FormField, ProfileImagePickerComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  @ViewChild(ProfileImagePickerComponent) imagePicker!: ProfileImagePickerComponent;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isAuthenticated = this.authService.isAuthenticated();
  protected displayMode = signal<'register' | 'login'>('login');

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

  protected setDisplayMode(displayMode: 'register' | 'login'): void {
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
    const success = await this.authService.register(val.username, val.password, val.confirmPassword, val.email, this.selectedFile, val.login);
    if (success) {
      if (this.imagePicker) {
        this.imagePicker.clearPreview();
      }
      this.setDisplayMode('login'); 
      if (val.login) {
        this.isAuthenticated = true;
        this.router.navigate(['/']);
      }
    }
  }

  private async login(): Promise<void> {
    const val = this.authModel();
    const success = await this.authService.login(val.username, val.password, val.remember);
    if (success) {
      this.isAuthenticated = true;
      this.router.navigate(['/']);
    }
  }

  protected logout(): void {
    this.authService.logout();
    this.isAuthenticated = false;
  }
}

