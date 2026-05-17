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

  constructor() {}

  public isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  public setAuthenticated(isAuthenticated: boolean): void {
    this.isAuthenticatedFlag = isAuthenticated;
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
      this.setAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  public logout(): void {
    this.setAuthenticated(false);
    // Add http call to your backend logout endpoint here if you have one!
  }

}
