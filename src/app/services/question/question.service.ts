import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { first, firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private readonly httpClient = inject(HttpClient);

  public async getQuestion(groupId: number): Promise<Question | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}questions/${groupId}`));
      console.log('Questions fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      throw error;
    }
  }

  public async submitVote(questionId: number, userInfo: string | number, votedUsersId: number[]): Promise<void> {
    try {
      const response = await firstValueFrom(this.httpClient.post(`${environment.apiUrl}questions/${questionId}/vote`, { user_info: userInfo, votedUsers: votedUsersId }));
      console.log('Vote submitted successfully:', response);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    }
  }

}
