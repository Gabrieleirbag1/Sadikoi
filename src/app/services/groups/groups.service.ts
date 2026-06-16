import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private readonly logger = inject(LoggerService)
  private readonly httpClient = inject(HttpClient);

  public async getGroups(): Promise<Group[] | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/user/`, { withCredentials: true }));
      this.logger.debug('Groups fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch groups:', error);
      throw error;
    }
  }

  public async getGroup(groupId: number): Promise<Group | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${groupId}/`, { withCredentials: true }));
      this.logger.debug('Group fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch group:', error);
      throw error;
    }
  }

  public async createGroup(groupName: string): Promise<Group | null> {
    const payload = { name: groupName };
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}groups/`, payload, { withCredentials: true }));
      this.logger.debug('Group created successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to create group:', error);
      throw error;
    }
  }

  public async updateGroup(groupId: number, name: string, decription: string, daily_reset_timestamp: string): Promise<Group | null> {
    try {
      const response = await firstValueFrom(this.httpClient.put<ApiResponse>(`${environment.apiUrl}groups/${groupId}/`, { name, description: decription, daily_reset_timestamp }, { withCredentials: true }));
      this.logger.debug('Group updated successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Group update failed:', error);
      throw error;
    }
  }
  
  public async getGroupInvitation(groupId: number): Promise<string | null> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${groupId}/invitations/`, { withCredentials: true }));
      this.logger.debug('Group invitation fetched successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to fetch group invitation:', error);
      throw error;
    }
  }

  public async answerGroupInvitation(token: string): Promise<Group | null> {
    try {
      const response = await firstValueFrom(this.httpClient.post<ApiResponse>(`${environment.apiUrl}groups/invitations/${token}/`, null, { withCredentials: true }));
      this.logger.debug('Group invitation answered successfully:', response);
      return response.content || null;
    } catch (error) {
      this.logger.error('Failed to answer group invitation:', error);
      throw error;
    }
  }

}
