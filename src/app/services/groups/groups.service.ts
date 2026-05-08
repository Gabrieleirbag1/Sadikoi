import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {

  private readonly httpClient = inject(HttpClient);

  public async getGroups(userId: number): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${environment.apiUrl}groups/${userId}`));
      console.log('Groups fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      throw error;
    }
  }
}
