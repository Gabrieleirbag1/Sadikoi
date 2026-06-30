import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly httpClient = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  public async submitBugReport(title: string, description: string) {
    const paylod = { title, description, device_name: navigator.platform };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}feedback/bug-reports/`, paylod, { withCredentials: true }));
      this.logger.debug('Bug report submitted successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Error submitting bug report:', error);
      return null;
    }
  }

  public async submitSuggestion(theme: string, question: string) {
    const paylod = { theme, question };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}feedback/suggestions/`, paylod, { withCredentials: true }));
      this.logger.debug('Suggestion submitted successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Error submitting suggestion:', error);
      return null;
    }
  }
  
}
