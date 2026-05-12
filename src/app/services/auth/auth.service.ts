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
      const user =JSON.parse(localStorage.getItem('user') || '{}');
      if (Object.keys(user).length === 0 || !user.id) {
        this.logout();
      } else {
        this.isAuthenticatedFlag = JSON.parse(savedAuthState);
      }
    }
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  public setAuthenticated(isAuthenticated: boolean): void {
    this.isAuthenticatedFlag = isAuthenticated;
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }

  // Helper method to fetch user details, can be used after login to get user info
  public async getUser(userInfo: number | string): Promise<User | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}account/${userInfo}`, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  // Helper method to get user details from local storage, if not found fetch from API
  public async getLocalUser(userInfo?: number | string): Promise<User | null> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (Object.keys(user).length === 0 || !user.id) {
      if (!userInfo) return null;
      const response = await this.getUser(userInfo);
      return response;
    }
    return user;
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
      localStorage.setItem('user', JSON.stringify(response.content));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  public logout(): void {
    this.setAuthenticated(false);
    localStorage.removeItem('user');
  }

}
