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

  /** Saves the three switches and every group's state in a single request. */
  public async saveSettings(settings: NotificationSettings): Promise<NotificationSettings | null> {
    const payload = {
      messages: settings.messages,
      questions: settings.questions,
      vote_reminder: settings.vote_reminder,
      groups: settings.groups.map(({ id, muted }) => ({ id, muted })),
    };
    try {
      const response = await firstValueFrom(this.httpClient.put<ApiResponse>(`${this.url}settings/`, payload, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to save notification settings:', error);
      return null;
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
