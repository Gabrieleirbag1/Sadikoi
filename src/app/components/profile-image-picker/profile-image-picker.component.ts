import { Component, computed, ElementRef, inject, input, model, viewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { ImagePreviewService } from '../../services/image-preview/image-preview.service';

@Component({
  selector: 'app-profile-image-picker',
  standalone: true,
  templateUrl: './profile-image-picker.component.html',
  styleUrl: './profile-image-picker.component.css'
})
export class ProfileImagePickerComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly imagePreview = inject(ImagePreviewService);

  public readonly currentImageUrl = model<string | null | undefined>(null);
  public readonly defaultImageUrl = model<string>('/default-profile.svg');
  public readonly fileSelected = model<File | null>(null);
  public readonly onlyDisplay = model<boolean>(false);
  public readonly imgClass = model<string>('');
  /** Display only: a click shows the picture full size (nothing happens for the default picture). */
  public readonly previewOnClick = input<boolean>(false);
  /** Alt text of the picture and its preview. */
  public readonly alt = input<string>('Profile Picture');
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

  /** Shown full size on click: only a real picture, not the default one (or one that failed to load). */
  protected readonly previewable = computed(() => this.onlyDisplay() && this.previewOnClick() && !!this.currentImageUrl());

  protected onImageClick(event: MouseEvent): void {
    if (!this.onlyDisplay()) {
      this.fileInput()?.nativeElement.click();
      return;
    }
    const image = event.target as HTMLImageElement;
    if (this.previewable() && !image.src.endsWith(this.defaultImageUrl())) {
      this.imagePreview.open(image.src, this.alt());
    }
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