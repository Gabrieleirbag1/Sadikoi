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

}
