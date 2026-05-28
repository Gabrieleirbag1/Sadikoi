import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { GoogleLoginComponent } from '../google-login/google-login.component';

@Component({
  selector: 'app-auth',
  imports: [GoogleLoginComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isAuthenticated = this.authService.isAuthenticated();
  protected displayMode = signal<'register' | 'login'>('login');

  protected setDisplayMode(displayMode: 'register' | 'login'): void {
    this.displayMode.set(displayMode);
  }

  protected async register(username: string, email: string, password: string, confirmPassword: string, profilePicture: File | null, login: boolean): Promise<void> {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    const success = await this.authService.register(username, password, email, profilePicture, login);
    if (success) {
      this.setDisplayMode('login'); 
      if (login) {
        this.isAuthenticated = true;
        this.router.navigate(['/']);
      }
    }
  }

  protected async login(usernameOrEmail: string, password: string, remember: boolean): Promise<void> {
    const success = await this.authService.login(usernameOrEmail, password, remember);
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
