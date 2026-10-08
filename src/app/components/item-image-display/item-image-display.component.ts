import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-item-image-display',
  templateUrl: './item-image-display.component.html',
  styleUrl: './item-image-display.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemImageDisplayComponent {
  public readonly itemName = input<string | null | undefined>(null);
  public readonly imgClass = input<string>('');

}
