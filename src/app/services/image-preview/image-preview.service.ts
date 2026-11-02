import { Injectable, signal } from '@angular/core';

export interface ImagePreview {
  url: string;
  alt: string;
}

/** Full screen view of an image (e.g. a profile picture), shown by ImagePreviewModalComponent. */
@Injectable({ providedIn: 'root' })
export class ImagePreviewService {
  private readonly _preview = signal<ImagePreview | null>(null);
  public readonly preview = this._preview.asReadonly();

  public open(url: string, alt = ''): void {
    this._preview.set({ url, alt });
  }

  public close(): void {
    this._preview.set(null);
  }
}
