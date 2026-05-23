import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private readonly httpClient = inject(HttpClient);

  public async getQuestion(groupId: number): Promise<Question | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}questions/${groupId}/`, { withCredentials: true }));
      console.log('Questions fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      throw error;
    }
  }

  public async submitVote(questionId: number, votedUsersId: number[]): Promise<Vote[] | null> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}questions/${questionId}/vote/`, { votedUsers: votedUsersId }, { withCredentials: true }));
      console.log('Vote submitted successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    }
  }

}
