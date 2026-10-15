import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly httpClient = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  public async submitBugReport(title: string, description: string): Promise<boolean> {
    const paylod = { title, description, device_name: navigator.platform };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}feedback/bug-reports/`, paylod, { withCredentials: true }));
      this.logger.debug('Bug report submitted successfully:', response);
      return response.success === true;
    } catch (error) {
      this.logger.error('Error submitting bug report:', error);
      return false;
    }
  }

  public async submitSuggestion(theme: string, question: string): Promise<boolean> {
    const paylod = { theme, question };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}feedback/suggestions/`, paylod, { withCredentials: true }));
      this.logger.debug('Suggestion submitted successfully:', response);
      return response.success === true;
    } catch (error) {
      this.logger.error('Error submitting suggestion:', error);
      return false;
    }
  }
  
}
