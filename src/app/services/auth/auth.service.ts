import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly httpClient = inject(HttpClient);

  public isAuthenticated(): boolean {
    // Placeholder method
    return false;
  }

  public register(username: string, password: string, email: string): void {
    const payload = { username, password, email };
    this.httpClient.post(`${environment.apiUrl}register`, payload).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
      },
      error: (error) => {
        console.error('Registration failed:', error);
      }
    }); 
  }

}
