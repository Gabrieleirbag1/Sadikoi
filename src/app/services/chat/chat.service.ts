import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LoggerService } from '../logger/logger.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly logger = inject(LoggerService)
  private readonly httpClient = inject(HttpClient);

  public async getMessages(groupId: number, questionId?: number): Promise<Message[]> {
    try {
      const params: Record<string, number> = questionId !== undefined ? { question_id: questionId } : {};
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${groupId}/messages/`, { params, withCredentials: true }));
      this.logger.debug('Fetched messages:', response.content);
      return response.content || [];
    } catch (error) {
      this.logger.error('Failed to fetch messages:', error);
      return [];
    }
  }

  public async sendMessage(groupId: number, content: string, questionId?: number): Promise<Message | null> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}groups/${groupId}/messages/`, { content, question_id: questionId }, { withCredentials: true }));
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      return null;
    }
  }

}
