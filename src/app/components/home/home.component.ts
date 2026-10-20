import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { GroupsComponent } from "../groups/groups.component";
import { AccountComponent } from "../account/account.component";
import { HomeFooterComponent } from "../layout/home-footer/home-footer.component";

/** Minimum horizontal distance (px) for a swipe, and how much more horizontal than vertical it must be. */
const SWIPE_MIN_DISTANCE = 70;
const SWIPE_DIRECTION_RATIO = 2;

@Component({
  selector: 'app-home',
  imports: [GroupsComponent, AccountComponent, HomeFooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true
})
export class HomeComponent {
  protected homeState = signal<HomeState>('groups');

  constructor() {
    this.listenForSwipes();
  }

  /** Mobile: swipe left on the groups to open the profile, swipe right to come back. */
  private listenForSwipes(): void {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let start: { x: number; y: number } | null = null;

    const onStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      // Ignore gestures in form fields and modals (text selection, sliders...).
      if (event.touches.length !== 1 || target.closest('input, textarea, select, .modal')) {
        start = null;
        return;
      }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    const onEnd = (event: TouchEvent) => {
      if (!start) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      start = null;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTION_RATIO) return;

      if (dx < 0 && this.homeState() === 'groups') this.changeHomeState('account');
      else if (dx > 0 && this.homeState() === 'account') this.changeHomeState('groups');
    };

    host.addEventListener('touchstart', onStart, { passive: true });
    host.addEventListener('touchend', onEnd, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      host.removeEventListener('touchstart', onStart);
      host.removeEventListener('touchend', onEnd);
    });
  }

  /** Same persistence as the footer menu, so a reload stays on the same tab. */
  private changeHomeState(state: HomeState): void {
    sessionStorage.setItem('homeState', state);
    this.homeState.set(state);
  }
}
