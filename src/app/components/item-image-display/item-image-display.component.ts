import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-item-image-display',
  templateUrl: './item-image-display.component.html',
  styleUrl: './item-image-display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemImageDisplayComponent {
  public readonly itemName = input<string | null | undefined>(null);
}
