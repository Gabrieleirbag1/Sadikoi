import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private readonly httpClient = inject(HttpClient);

  public async getMessages(groupId: number): Promise<Message[]> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`/api/groups/${groupId}/messages`));
      return response.content || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  public async sendMessage(groupId: number, content: string, userInfo: string | number): Promise<Message | null> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`/api/groups/${groupId}/messages`, { content, user_info: userInfo }));
      return response.content || null;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }
  
}
