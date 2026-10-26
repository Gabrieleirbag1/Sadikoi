import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

type GlobalSetting = 'messages' | 'questions' | 'vote_reminder';

/** Push notification preferences of the account (they apply to every phone of the user). */
@Injectable({
  providedIn: 'root',
})
export class NotificationSettingsService {
  private readonly logger = inject(LoggerService);
  private readonly httpClient = inject(HttpClient);
  private readonly url = `${environment.apiUrl}notifications/`;

  public async getSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${this.url}settings/`, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch notification settings:', error);
      return null;
    }
  }

  public async updateSetting(name: GlobalSetting, value: boolean): Promise<boolean> {
    try {
      await firstValueFrom(this.httpClient.put<ApiResponse>(`${this.url}settings/`, { [name]: value }, { withCredentials: true }));
      return true;
    } catch (error) {
      this.logger.error('Failed to update notification setting:', error);
      return false;
    }
  }

  public async setGroupMuted(groupId: number, muted: boolean): Promise<boolean> {
    try {
      await firstValueFrom(this.httpClient.put<ApiResponse>(`${this.url}groups/${groupId}/`, { muted }, { withCredentials: true }));
      return true;
    } catch (error) {
      this.logger.error('Failed to update group notifications:', error);
      return false;
    }
  }

  public async registerDevice(token: string, deviceId: string, platform: string): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.post<ApiResponse>(`${this.url}devices/`, { token, device_id: deviceId, platform }, { withCredentials: true }));
    } catch (error) {
      this.logger.error('Failed to register the device for push notifications:', error);
    }
  }
}
