import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** A tutorial popup (welcome, voting or results tip): closed by its cross, a click outside, Escape or "Got it". */
@Component({
  selector: 'app-tutorial-modal',
  imports: [TranslatePipe],
  templateUrl: './tutorial-modal.component.html',
  styleUrl: './tutorial-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialModalComponent {
  public readonly title = input.required<string>();
  /** 'large' for the welcome, 'small' for the short tips. */
  public readonly size = input<'large' | 'small'>('small');
  public readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }
}
