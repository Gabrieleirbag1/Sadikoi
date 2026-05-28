import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { form, FormField } from "@angular/forms/signals";
import { AuthService } from '../../services/auth/auth.service';
import { LoggerService } from '../../services/logger/logger.service';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';

@Component({
  selector: 'app-account',
  imports: [CommonModule, FormField, ProfileImagePickerComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  @ViewChild(ProfileImagePickerComponent) imagePicker!: ProfileImagePickerComponent;
  
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);

  protected profilePictureUrl: string | null = environment.apiUrl + '/auth/profile-picture/';
  protected user: User | null = null;
  private selectedFile: File | null = null;
  protected timestamp = Date.now();

  protected authModel = signal({
    username: this.user?.username || '',
    email: this.user?.email || '',
    password: '',
    confirmPassword: '',
    login: true,
    remember: false
  });

  protected authForm = form(this.authModel);

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (this.user) {
      this.authModel.update(model => ({
        ...model,
        username: this.user?.username || '',
        email: this.user?.email || ''
      }));
    }
  }

  protected handleFileSelected(file: File | null): void {
    this.selectedFile = file;
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
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
      this.timestamp = Date.now();
      if (this.imagePicker) {
        this.imagePicker.clearPreview();
      }
    } else {
      this.logger.error('Failed to update account');
    }
  }

}
