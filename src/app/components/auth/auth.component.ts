import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-auth.component',
  imports: [],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {

  private readonly authService = inject(AuthService);

  public isAuhenticated(): boolean {
    return true;
  }

  protected register(username: string, password: string, email: string): void {
    this.authService.register(username, password, email);
  }
}
