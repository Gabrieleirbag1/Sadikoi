import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { form, FormField } from "@angular/forms/signals";
import { AuthService } from '../../services/auth/auth.service';
import { LoggerService } from '../../services/logger/logger.service';

@Component({
  selector: 'app-account',
  imports: [CommonModule, FormField],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  protected user: User | null = null;
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  protected profilePictureUrl: string | null = environment.apiUrl + '/auth/profile-picture/';

  protected authModel = signal({
    username: this.user?.username || '',
    email: this.user?.email || '',
    password: '',
    confirmPassword: '',
    login: true,
    remember: false
  });

  public ngOnInit(): void {
    this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
    if (this.user) {
      this.authModel.update(model => ({
        ...model,
        username: this.user?.username || '',
        email: this.user?.email || ''
      }));
    }
  }

  protected authForm = form(this.authModel);
    
  private selectedFile: File | null = null;
  protected previewUrl: string | null = null;
  protected timestamp = Date.now();

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    if (this.selectedFile) {
      this.previewUrl = URL.createObjectURL(this.selectedFile);
    } else {
      this.previewUrl = null;
    }
  }

  protected async updateAccount(event: Event): Promise<void> {
    event.preventDefault();
    const val = this.authModel();
    if (val.password && val.password !== val.confirmPassword) {
      this.logger.error('Passwords do not match!');
      return;
    }
    const success = await this.authService.updateUser(val.username, val.email, val.password, val.confirmPassword, this.selectedFile);
    if (success) {
      this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
      this.timestamp = Date.now();
      this.previewUrl = null;
    } else {
      this.logger.error('Failed to update account');
    }
  }

}
