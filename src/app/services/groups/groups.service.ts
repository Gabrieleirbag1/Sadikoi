import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {

  private readonly httpClient = inject(HttpClient);

  public async getGroups(userId: number): Promise<any | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${userId}`));
      console.log('Groups fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      throw error;
    }
  }

  public async createGroup(groupName: string, userId: number): Promise<any | null> {
    const payload = { name: groupName, user_info: userId };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}groups`, payload));
      console.log('Group created successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

}
