import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private readonly logger = inject(LoggerService)
  private readonly httpClient = inject(HttpClient);

  public async getQuestion(groupId: number): Promise<Question | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}questions/${groupId}/`, { withCredentials: true }));
      this.logger.debug('Questions fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch questions:', error);
      throw error;
    }
  }

  public async submitVote(groupId: number, votedUsersId: number[], writtenAnswer?: string): Promise<Vote[] | null> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}questions/${groupId}/vote/`, { votedUsers: votedUsersId, writtenAnswer }, { withCredentials: true }));
      this.logger.debug('Vote submitted successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to submit vote:', error);
      throw error;
    }
  }

}
