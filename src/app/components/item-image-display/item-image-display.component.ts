import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, ViewEncapsulation } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** How long the touch tooltip stays up without another tap. */
const TOOLTIP_DURATION_MS = 2500;
/** Gap between the icon and the tooltip, and minimum distance to the screen edges. */
const TOOLTIP_GAP = 8;

/** The touch tooltip on screen (only one at a time, whichever icon opened it). */
let openTooltip: { owner: ItemImageDisplayComponent; close: () => void } | null = null;

@Component({
  selector: 'app-item-image-display',
  imports: [TranslatePipe],
  templateUrl: './item-image-display.component.html',
  styleUrl: './item-image-display.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemImageDisplayComponent {
  public readonly itemName = input<string | null | undefined>(null);
  public readonly imgClass = input<string>('');

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (openTooltip?.owner === this) openTooltip.close();
    });
  }

  /**
   * Touch screens have no hover, so the `title` never shows: a tap shows the item's name in a bubble
   * instead (a second tap on the same icon hides it). The tap stops there: it doesn't also open the
   * group card the icon sits in. Mouse clicks keep their usual behaviour (the `title` shows on hover).
   */
  protected onTap(event: MouseEvent, name: string | null): void {
    const touch = (event as PointerEvent).pointerType === 'touch' || !!window.matchMedia?.('(hover: none)').matches;
    if (!touch || !name) return;
    event.preventDefault();
    event.stopPropagation();

    const wasOpen = openTooltip?.owner === this;
    openTooltip?.close();
    if (!wasOpen) this.showTooltip(event.currentTarget as HTMLElement, name);
  }

  /** In <body>, so neither a card's `overflow: hidden` nor a modal's `transform` cuts or shifts it. */
  private showTooltip(icon: HTMLElement, name: string): void {
    const tooltip = document.createElement('div');
    tooltip.className = 'item-touch-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = name;
    document.body.appendChild(tooltip);

    // Above the icon, or below when there's no room; always fully on screen.
    const iconRect = icon.getBoundingClientRect();
    const { width, height } = tooltip.getBoundingClientRect();
    const left = Math.min(
      Math.max(TOOLTIP_GAP, iconRect.left + iconRect.width / 2 - width / 2),
      window.innerWidth - width - TOOLTIP_GAP,
    );
    const above = iconRect.top - TOOLTIP_GAP - height;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${above >= TOOLTIP_GAP ? above : iconRect.bottom + TOOLTIP_GAP}px`;

    // Any other touch, scroll or resize hides it (the tapped icon handles its own second tap).
    const onPointerDown = (event: Event) => {
      if (!icon.contains(event.target as Node)) close();
    };
    const timer = setTimeout(() => close(), TOOLTIP_DURATION_MS);
    const close = () => {
      clearTimeout(timer);
      tooltip.remove();
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      if (openTooltip?.owner === this) openTooltip = null;
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    openTooltip = { owner: this, close };
  }
}
