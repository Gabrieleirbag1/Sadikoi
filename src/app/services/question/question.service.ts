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

  private convertDateToLocalTimezone(date: string): string {
    return date;
    const localDate = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
  }

  public async getQuestion(groupId: number): Promise<Question | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}questions/${groupId}/`, { withCredentials: true }));
      this.logger.debug('Question fetched successfully:', response);
      const question = response.content;
      if (question && question.date) {
        question.date = this.convertDateToLocalTimezone(question.date);
      }
      return question || null;
    } catch (error) {
      this.logger.error('Failed to fetch questions:', error);
      throw error;
    }
  }

  public async getQuestionsByDate(groupId: number, month: number, year: number): Promise<Question | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}questions/${groupId}/${month}/${year}/`, { withCredentials: true }));
      this.logger.debug('Questions fetched successfully:', response);
      const questions = response.content;
      const dailyResetTimestamp = "15:00"
      if (questions && Array.isArray(questions)) {
        questions.forEach((question: Question) => {
          if (question.date) {
            question.date = this.convertDateToLocalTimezone(question.date);
          }
        });
      }
      return questions || null;
    } catch (error) {
      this.logger.error('Failed to fetch questions by month:', error);
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
