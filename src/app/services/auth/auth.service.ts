import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly httpClient = inject(HttpClient);

  public isAuthenticated(): boolean {
    return false;
  }

  public async register(username: string, password: string, email: string): Promise<boolean> {
    const payload = { username, password, email };
    try {
      const response = await firstValueFrom(this.httpClient.post(`${environment.apiUrl}register`, payload));
      console.log('Registration successful:', response);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }

  public async login(username_or_email: string, password: string): Promise<void> {
    const payload = { username_or_email, password };
    try {
      const response = await firstValueFrom(this.httpClient.post(`${environment.apiUrl}login`, payload));
      console.log('Login successful:', response);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

}
