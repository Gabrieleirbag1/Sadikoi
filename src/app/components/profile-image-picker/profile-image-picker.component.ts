import { Component, computed, ElementRef, inject, model, viewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-profile-image-picker',
  standalone: true,
  templateUrl: './profile-image-picker.component.html',
  styleUrl: './profile-image-picker.component.css'
})
export class ProfileImagePickerComponent {
  private readonly sanitizer = inject(DomSanitizer);

  public readonly currentImageUrl = model<string | null | undefined>(null);
  public readonly defaultImageUrl = model<string>('/default-profile.svg');
  public readonly fileSelected = model<File | null>(null);
  public readonly onlyDisplay = model<boolean>(false);
  public readonly imgClass = model<string>('');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  
  protected readonly profilePictureUrl: string | null = environment.apiUrl + '/auth/profile-picture/';
  protected readonly previewUrl = model<string | null>(null);

  protected readonly displayUrl = computed<SafeUrl | string>(() => {
    const preview = this.previewUrl();
    if (preview) {
      return this.sanitizer.bypassSecurityTrustUrl(preview);
    }

    let current = this.currentImageUrl();
    if (current) {
      current = this.profilePictureUrl + current;
      return this.sanitizer.bypassSecurityTrustUrl(current);
    }

    return this.defaultImageUrl();
  });

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src.endsWith(this.defaultImageUrl())) {
      return;
    }
    image.src = this.defaultImageUrl();
  }

  public clearPreview(): void {
    this.previewUrl.set(null);
    this.fileSelected.set(null);
  }

  protected openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file) {
      this.previewUrl.set(URL.createObjectURL(file));
    } else {
      this.previewUrl.set(null);
    }
    this.fileSelected.set(file);
  }
}