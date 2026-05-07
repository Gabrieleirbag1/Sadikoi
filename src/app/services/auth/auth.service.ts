import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly httpClient = inject(HttpClient);
  private isAuthenticatedFlag = false;

  constructor() {
    const savedAuthState = localStorage.getItem('isAuthenticated');
    if (savedAuthState) {
      this.isAuthenticatedFlag = JSON.parse(savedAuthState);
    }
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  public setAuhenticated(isAuthenticated: boolean): void {
    this.isAuthenticatedFlag = isAuthenticated;
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
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

  public async login(username_or_email: string, password: string): Promise<boolean> {
    const payload = { username_or_email, password };
    try {
      const response = await firstValueFrom(this.httpClient.post(`${environment.apiUrl}login`, payload));
      console.log('Login successful:', response);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

}
