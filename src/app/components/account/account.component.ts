import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  imports: [CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  protected user: User | null = null;
  protected profilePictureUrl: string | null = environment.apiUrl + '/auth/profile-picture/';

  public ngOnInit(): void {
    this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
  }
}
