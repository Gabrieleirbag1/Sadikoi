import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly logger = inject(LoggerService)
  private readonly httpClient = inject(HttpClient);
  private isAuthenticatedFlag = false;

  constructor() {
    this.setup();
  }

  private setup(): void {
    this.initializeAuthState();
    const savedAuthState = localStorage.getItem('isAuthenticated');
    if (savedAuthState) {
      const parsedAuthState = JSON.parse(savedAuthState);
      if (parsedAuthState) {
        const user =JSON.parse(localStorage.getItem('user') || '{}');
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

  private setAuthSession(user: any, isAuthenticated: boolean): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.setAuthenticated(isAuthenticated);
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  private setAuthenticated(isAuthenticated: boolean): void {
    localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
    this.isAuthenticatedFlag = isAuthenticated;
  }

  // Helper method to fetch user details, can be used after login to get user info
  public async getUser(): Promise<User | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}auth/account/`, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch user:', error);
      return null;
    }
  }

  public async register(username: string, password: string, confirmPassword: string, email: string, profile_picture: File | null, login: boolean): Promise<boolean> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('confirm_password', confirmPassword);
    formData.append('email', email);
    formData.append('login', String(login));
    formData.append('device_id', navigator.userAgent);
    formData.append('device_name', navigator.platform);
    if (profile_picture) {
      formData.append('profile_picture', profile_picture);
    }

    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}auth/register/`, formData, { withCredentials: true }));
      this.logger.debug('Registration successful:', response);
      if (login) this.setAuthSession(response.content, true);
      return true;
    } catch (error) {
      this.logger.error('Registration failed:', error);
      return false;
    }
  }

  public async updateUser(username: string, email: string, password: string, confirmPassword: string, profile_picture: File | null): Promise<boolean> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    if (password) {
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);
    }
    if (profile_picture) {
      formData.append('profile_picture', profile_picture);
    }

    try {
      const response = await firstValueFrom(this.httpClient.put<ApiResponse>(`${environment.apiUrl}auth/account/`, formData, { withCredentials: true }));
      this.logger.debug('User update successful:', response);
      this.setAuthSession(response.content, true);
      return true;
    } catch (error) {
      this.logger.error('User update failed:', error);
      return false;
    }
  }

  public async login(username_or_email: string, password: string, remember: boolean): Promise<boolean> {
    const payload = { username_or_email, password, remember, device_id: navigator.userAgent,device_name: navigator.platform };

    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}auth/login/`, payload, { withCredentials: true }));
      this.logger.debug('Login successful:', response);
      this.setAuthSession(response.content, true);
      return true;
    } catch (error) {
      this.logger.error('Login failed:', error);
      return false;
    }
  }

  public async googleLogin(token: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}auth/google/`, { token }, { withCredentials: true }));
      this.logger.debug('Google login successful:', response);
      this.setAuthSession(response.content, true);
      return true;
    } catch (error) {
      this.logger.error('Google login failed:', error);
      return false;
    }
  }

  public async logout(): Promise<void> {
    const payload = { device_id: navigator.userAgent, device_name: navigator.platform };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}auth/logout/`, payload, { withCredentials: true }));
      this.logger.debug('Logout successful:', response);
      this.setAuthSession(response.content, false);
      localStorage.removeItem('user');
    } catch (error) {
      this.logger.error('Logout failed:', error);
    }
  }

  public async verifyDevice(userInfo: string, code: string): Promise<boolean> {
    const payload = { user_info: userInfo, device_id: navigator.userAgent, device_name: navigator.platform, code: code };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}auth/security/verify-device/`, payload, { withCredentials: true }));
      this.logger.debug('Device verification successful:', response);
      return response.success;
    } catch (error) {
      this.logger.error('Device verification failed:', error);
      return false;
    }
  }
}
