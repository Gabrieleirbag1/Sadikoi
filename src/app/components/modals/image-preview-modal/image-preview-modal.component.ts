import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ImagePreviewService } from '../../../services/image-preview/image-preview.service';
import { closeOnEscape } from '../../../services/escape/escape.service';

@Component({
  selector: 'app-image-preview-modal',
  imports: [TranslatePipe],
  templateUrl: './image-preview-modal.component.html',
  styleUrl: './image-preview-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewModalComponent {
  protected readonly imagePreviewService = inject(ImagePreviewService);

  constructor() {
    // Above everything else: opened last (from a profile card...).
    closeOnEscape(() => this.close(), () => !!this.imagePreviewService.preview());
  }

  protected close(): void {
    this.imagePreviewService.close();
  }
}
