import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from "@angular/forms/signals";
import { AuthService } from '../../services/auth/auth.service';
import { LoggerService } from '../../services/logger/logger.service';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ModalComponent } from '../modals/modal/modal.component';
import { ModalService } from '../../services/modal/modal.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification/notification.service';
import { deviceLanguage, toSupportedLanguage } from '../../utils/language';
import { HomeTransitionService } from '../../services/home-transition/home-transition.service';

@Component({
  selector: 'app-account',
  imports: [CommonModule, FormField, ProfileImagePickerComponent, TranslatePipe, ModalComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
  host: { '[class.page-enter-from-right]': 'slideIn' },
})
export class AccountComponent implements OnInit {
  @ViewChild(ProfileImagePickerComponent) imagePicker!: ProfileImagePickerComponent;
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly translate = inject(TranslateService);
  private readonly notificationService = inject(NotificationService);

  protected devices = signal<Device[] | null>(null);
  protected user: User | null = null;
  protected userPfpUrl: string | null = null;
  private readonly selectedFile = signal<File | null>(null);
  /** The account as saved: the update button stays greyed out until the form differs from it. */
  private readonly savedAccount = signal({ username: '', email: '', language: '' });
  protected readonly saving = signal(false);
  protected timestamp = Date.now();

  protected authModel = signal({
    username: this.user?.username || '',
    email: this.user?.email || '',
    password: '',
    confirmPassword: '',
    login: true,
    remember: false,
    language: toSupportedLanguage(this.user?.language) ?? deviceLanguage()
  });

  protected authForm = form(this.authModel);

  /** Something to save: a field changed, a new password or a new picture (like the notification settings). */
  protected readonly dirty = computed(() => {
    const value = this.authModel();
    const saved = this.savedAccount();
    return value.username !== saved.username || value.email !== saved.email || value.language !== saved.language
      || !!value.password || !!value.confirmPassword || !!this.selectedFile();
  });

  /** Opened from home (bottom bar, swipe, settings): slides in from the right. */
  protected readonly slideIn = inject(HomeTransitionService).take('account');

  constructor() {
    // Language changed from the settings while this page is open: the form follows, so saving doesn't undo it.
    this.translate.onLangChange.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(event => {
      const language = toSupportedLanguage(event.lang);
      if (!language) return;
      this.authModel.update(model => ({ ...model, language }));
      // The settings save it on the account themselves: nothing left to save here.
      this.savedAccount.update(saved => ({ ...saved, language }));
    });
  }

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (this.user) {
      this.authModel.update(model => ({
        ...model,
        username: this.user?.username || '',
        email: this.user?.email || '',
        language: toSupportedLanguage(this.user?.language) ?? deviceLanguage()
      }));
      const { username, email, language } = this.authModel();
      this.savedAccount.set({ username, email, language });
      this.setPfpUrl();
    }
  }

  private setPfpUrl(): void {
    if (this.user?.profile_picture) {
      if (this.user.profile_picture.includes('googleusercontent.com')) {
        this.userPfpUrl = this.user.profile_picture;
        return;
      }
      this.userPfpUrl = this.user.profile_picture + '?t=' + this.timestamp;
    } else {
      this.userPfpUrl = null;
    }
  }

  protected handleFileSelected(file: File | null): void {
    this.selectedFile.set(file);
  }

  protected async updateAccount(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.dirty() || this.saving()) return;
    const val = this.authModel();
    if (val.password && val.password !== val.confirmPassword) {
      this.logger.error('Passwords do not match!');
      this.notificationService.showError(this.translate.instant('notification.passwordsMismatch'));
      return;
    }
    this.saving.set(true);
    const success = await this.authService.updateUser(val.username, val.email, val.password, val.confirmPassword, this.selectedFile(), val.language as Language)
      .finally(() => this.saving.set(false));
    if (success) {
      // Saved: the form is the new reference, the passwords typed are not kept.
      this.savedAccount.set({ username: val.username, email: val.email, language: val.language });
      this.authModel.update(model => ({ ...model, password: '', confirmPassword: '' }));
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
      this.timestamp = Date.now();
      this.setPfpUrl();
      if (this.imagePicker) {
        this.imagePicker.clearPreview();
      }
      this.selectedFile.set(null);
      this.notificationService.showSuccess(this.translate.instant('notification.accountUpdated'));
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

  protected openLogoutAllDevicesModal(): void {
    this.openModal(
      'logout-all-devices',
      this.translate.instant('account.logoutAllDevicesTitle'),
      this.translate.instant('account.logoutAllDevicesDescription'),
      () => this.logoutAllDevices(),
    );
  }

  protected openRevokeDeviceModal(deviceId: string): void {
    this.openModal(
      'revoke-device',
      this.translate.instant('account.revokeDeviceTitle'),
      this.translate.instant('account.revokeDeviceDescription'),
      () => this.revokeDevice(deviceId),
    );
  }

  protected openDeleteModal(): void {
    this.openModal(
      'delete-account',
      this.translate.instant('account.deleteAccountTitle'),
      this.translate.instant('account.deleteAccountDescription'),
      () => this.deleteAccount(),
    );
  }

  protected redirectLogout(): void {
    this.router.navigate(['/auth']);
  }

  private async deleteAccount(): Promise<void> {
    if (!this.user) return;
    const success = await this.authService.deleteUser(this.user.username);
    if (success) {
      this.logger.debug('Account deleted successfully');
    } else {
      this.logger.error('Failed to delete account');
    }
  }

  protected openModal(modalId: string, title: string, description: string, saveCallback: () => void) {
    this.modalService.open(modalId, {
      title,
      description,
      save: saveCallback,
      discard: () => this.logger.debug('Modal cancelled:', modalId),
    });
  }

}
