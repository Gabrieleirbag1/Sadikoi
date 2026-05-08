import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isAuhenticated = this.authService.isAuthenticated();
  protected displayMode = signal<'register' | 'login'>('login');

  protected setDisplayMode(displayMode: 'register' | 'login'): void {
    this.displayMode.set(displayMode);
  }

  protected async register(username: string, password: string, email: string): Promise<void> {
    const success = await this.authService.register(username, password, email);
    if (success) this.setDisplayMode('login'); 
  
  }

  protected async login(usernameOrEmail: string, password: string): Promise<void> {
    const success = await this.authService.login(usernameOrEmail, password);
    if (success) {
      this.authService.setAuthenticated(true);
      this.isAuhenticated = true;
      this.router.navigate(['/dashboard']);
    }
  }

  protected logout(): void {
    this.authService.setAuthenticated(false);
    this.isAuhenticated = false;
    this.router.navigate(['/login']);
  }
  
}
