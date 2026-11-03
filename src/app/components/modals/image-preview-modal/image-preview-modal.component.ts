import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ImagePreviewService } from '../../../services/image-preview/image-preview.service';

@Component({
  selector: 'app-image-preview-modal',
  imports: [TranslatePipe],
  templateUrl: './image-preview-modal.component.html',
  styleUrl: './image-preview-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewModalComponent {
  protected readonly imagePreviewService = inject(ImagePreviewService);

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.imagePreviewService.close();
  }
}
