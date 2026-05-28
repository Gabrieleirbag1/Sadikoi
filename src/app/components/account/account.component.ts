import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account',
  imports: [CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  protected user: User | null = null;

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

}
