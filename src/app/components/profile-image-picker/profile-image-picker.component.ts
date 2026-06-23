import { Component, computed, inject, model } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-profile-image-picker',
  standalone: true,
  templateUrl: './profile-image-picker.component.html',
  styleUrl: './profile-image-picker.component.css'
})
export class ProfileImagePickerComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly currentImageUrl = model<string | null>(null);
  readonly defaultImageUrl = model<string>('/default-profile.svg');
  readonly fileSelected = model<File | null>(null);

  protected previewUrl = model<string | null>(null);

  protected readonly displayUrl = computed<SafeUrl | string>(() => {
    const preview = this.previewUrl();
    if (preview) {
      return this.sanitizer.bypassSecurityTrustUrl(preview);
    }

    const current = this.currentImageUrl();
    if (current) {
      return this.sanitizer.bypassSecurityTrustUrl(current);
    }

    return this.defaultImageUrl();
  });

  public clearPreview(): void {
    this.previewUrl.set(null);
    this.fileSelected.set(null);
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