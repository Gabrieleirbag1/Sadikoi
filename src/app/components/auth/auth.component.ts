import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-auth.component',
  imports: [],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {

  private readonly authService = inject(AuthService);
  protected displayMode = signal<'register' | 'login'>('login');

  public isAuhenticated(): boolean {
    return true;
  }

  protected setDisplayMode(displayMode: 'register' | 'login'): void {
    this.displayMode.set(displayMode);
  }

  protected async register(username: string, password: string, email: string): Promise<void> {
    const sucess = await this.authService.register(username, password, email);
    if (sucess) this.setDisplayMode('login'); 
  
  }

  protected login(usernameOrEmail: string, password: string): void {
    this.authService.login(usernameOrEmail, password);
  }
}
