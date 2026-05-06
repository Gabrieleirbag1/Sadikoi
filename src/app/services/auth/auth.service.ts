import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8082';

  public register(username: string, password: string, email: string): void {
    const payload = { username, password, email };
    this.httpClient.post(`${this.apiUrl}/api/register`, payload).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
      },
      error: (error) => {
        console.error('Registration failed:', error);
      }
    }); 
  }

}
