import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

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

  /** Saves the global switches. */
  public async saveSettings(settings: NotificationSettings): Promise<NotificationSettings | null> {
    try {
      const response = await firstValueFrom(this.httpClient.put<ApiResponse>(`${this.url}settings/`, settings, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to save notification settings:', error);
      return null;
    }
  }

  /** One group's switches, with the global ones. */
  public async getGroupSettings(groupId: number): Promise<GroupNotificationSettings | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${this.url}settings/groups/${groupId}/`, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch group notification settings:', error);
      return null;
    }
  }

  /** Saves any of one group's switches. */
  public async saveGroupSettings(groupId: number, changes: Partial<NotificationSettings>): Promise<GroupNotificationSettings | null> {
    try {
      const response = await firstValueFrom(this.httpClient.put<ApiResponse>(`${this.url}settings/groups/${groupId}/`, changes, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to save group notification settings:', error);
      return null;
    }
  }

  /** The group is open on this device: the API removes its notifications from the user's other phones. */
  public async markGroupSeen(groupId: number, deviceId: string): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.post<ApiResponse>(`${this.url}groups/${groupId}/seen/`, { device_id: deviceId }, { withCredentials: true }));
    } catch (error) {
      this.logger.debug('Failed to mark the group as seen:', error);
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
