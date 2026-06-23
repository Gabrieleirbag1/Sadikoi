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

  protected devices = signal<Device[] | null>(null);
  protected profilePictureUrl: string | null = environment.apiUrl + '/auth/profile-picture/';
  protected user: User | null = null;
  protected userPfpUrl: string | null = null;
  private selectedFile: File | null = null;
  protected timestamp = Date.now();

  protected authModel = signal({
    username: this.user?.username || '',
    email: this.user?.email || '',
    password: '',
    confirmPassword: '',
    login: true,
    remember: false,
    language: this.user?.language || navigator.language
  });

  protected authForm = form(this.authModel);

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (this.user) {
      this.authModel.update(model => ({
        ...model,
        username: this.user?.username || '',
        email: this.user?.email || '',
        language: this.user?.language || navigator.language
      }));
      this.setPfpUrl();
    }
  }

  private setPfpUrl(): void {
    if (this.user?.profile_picture) {
      if (this.user.profile_picture.includes('googleusercontent.com')) {
        this.userPfpUrl = this.user.profile_picture;
        return;
      }
      this.userPfpUrl = this.profilePictureUrl + '/' + this.user.profile_picture + '?t=' + this.timestamp;
    } else {
      this.userPfpUrl = null;
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
    const success = await this.authService.updateUser(val.username, val.email, val.password, val.confirmPassword, this.selectedFile, val.language as Language);
    if (success) {
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
      this.timestamp = Date.now();
      this.setPfpUrl();
      if (this.imagePicker) {
        this.imagePicker.clearPreview();
      }
    } else {
      this.logger.error('Failed to update account');
    }
  }

  protected async getDevices(): Promise<void> {
    try {
      const devices = await this.authService.getDevices();
      this.devices.set(devices);
      this.logger.debug('Devices:', devices);
    } catch (error) {
      this.logger.error('Failed to get devices:', error);
    }
  }

  protected async revokeDevice(deviceId: string): Promise<void> {
    try {
      const success = await this.authService.revokeDevice(deviceId);
      if (success) {
        this.logger.debug(`Device ${deviceId} revoked successfully`);
        // Remove the revoked device from the list
        this.devices.update(devices => devices?.filter(device => device.device_id !== deviceId) || null);
      } else {
        this.logger.error(`Failed to revoke device ${deviceId}`);
      }
    } catch (error) {
      this.logger.error(`Error revoking device ${deviceId}:`, error);
    }
  }

  protected async logoutAllDevices(): Promise<void> {
    try {
      await this.authService.logoutDevices();
    } catch (error) {
      this.logger.error('Failed to logout all devices:', error);
    }
  }

}
