import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {

  private readonly httpClient = inject(HttpClient);

  public async getGroups(): Promise<Group[] | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/user/`, { withCredentials: true }));
      console.log('Groups fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      throw error;
    }
  }

  public async getGroup(groupId: number): Promise<Group | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${groupId}/`, { withCredentials: true }));
      console.log('Group fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch group:', error);
      throw error;
    }
  }

  public async createGroup(groupName: string): Promise<Group | null> {
    const payload = { name: groupName };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}groups/`, payload, { withCredentials: true }));
      console.log('Group created successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  public async getGroupInvitation(groupId: number): Promise<string | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${groupId}/invitations/`, { withCredentials: true }));
      console.log('Group invitation fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to fetch group invitation:', error);
      throw error;
    }
  }

  public async answerGroupInvitation(token: string): Promise<Group | null> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}groups/invitations/${token}/`, null, { withCredentials: true }));
      console.log('Group invitation answered successfully:', response);
      return response.content || null;
    } catch (error) {
      console.error('Failed to answer group invitation:', error);
      throw error;
    }
  }

}
