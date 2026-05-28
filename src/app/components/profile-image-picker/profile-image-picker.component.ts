import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-profile-image-picker',
  standalone: true,
  templateUrl: './profile-image-picker.component.html',
  styleUrl: './profile-image-picker.component.css'
})
export class ProfileImagePickerComponent {
  @Input() currentImageUrl: string | null = null;
  @Input() defaultImageUrl: string = '/default-profile.svg';
  
  @Output() fileSelected = new EventEmitter<File | null>();

  protected previewUrl: string | null = null;

  public clearPreview(): void {
    this.previewUrl = null;
    this.fileSelected.emit(null);
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file) {
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.previewUrl = null;
    }
    this.fileSelected.emit(file);
  }
}
