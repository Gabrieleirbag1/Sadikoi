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
    this.initializeAuthState();
    const savedAuthState = sessionStorage.getItem('isAuthenticated');
    if (savedAuthState) {
      const parsedAuthState = JSON.parse(savedAuthState);
      if (parsedAuthState) {
        const user =JSON.parse(sessionStorage.getItem('user') || '{}');
        if (Object.keys(user).length === 0 || !user.id) {
          this.logout();
        } else {
          this.isAuthenticatedFlag = parsedAuthState;
        }
      }
    }
  }

  private async initializeAuthState(): Promise<void> {
    const response = await this.getUser();
    if (response) {
      this.setAuthenticated(true);
    } else {
      this.setAuthenticated(false);
    }
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  public setAuthenticated(isAuthenticated: boolean): void {
    sessionStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
    this.isAuthenticatedFlag = isAuthenticated;
  }

  // Helper method to fetch user details, can be used after login to get user info
  public async getUser(): Promise<User | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}account`, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  public async register(username: string, password: string, email: string): Promise<boolean> {
    const payload = { username, password, email };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}register`, payload, { withCredentials: true }));
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
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}login`, payload, { withCredentials: true }));
      console.log('Login successful:', response);
      sessionStorage.setItem('user', JSON.stringify(response.content));
      this.setAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  public async logout(): Promise<void> {
    try {
        const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}logout`, null, { withCredentials: true }));
        console.log('Login successful:', response);
        sessionStorage.setItem('user', JSON.stringify(response.content));
        this.setAuthenticated(false);
        sessionStorage.removeItem('user');
      } catch (error) {
        console.error('Login failed:', error);
        }
    }
}
