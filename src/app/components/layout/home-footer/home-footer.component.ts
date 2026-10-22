import { Component, DestroyRef, inject, input, model, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Minimum horizontal distance (px) for a swipe, and how much more horizontal than vertical it must be. */
const SWIPE_MIN_DISTANCE = 70;
const SWIPE_DIRECTION_RATIO = 2;

@Component({
  selector: 'app-home-footer',
  imports: [TranslatePipe],
  templateUrl: './home-footer.component.html',
  styleUrl: './home-footer.component.css',
})
export class HomeFooterComponent implements OnInit {
  protected readonly router = inject(Router);
  public readonly homeState = model<HomeState>('groups');
  public readonly redirect = model<boolean>(false);
  public readonly groupId = input<number | null>(null);

  constructor() {
    this.listenForSwipes();
  }

  public ngOnInit(): void {
    if (this.homeState() === 'group') return;

    const saved = sessionStorage.getItem('homeState') as HomeState | null;
    if (saved) this.homeState.set(saved);
  }

  protected changeHomeState(newState: HomeState): void {
    if (newState === 'account' && this.homeState() === 'group') {
      const groupId = this.groupId();
      if (groupId !== null) sessionStorage.setItem('pendingGroupId', String(groupId));
    }

    if (newState === 'groups') {
      const pendingGroupId = sessionStorage.getItem('pendingGroupId');
      sessionStorage.removeItem('pendingGroupId');

      if (pendingGroupId) {
        this.homeState.set(newState);
        this.router.navigate(['/group', pendingGroupId]);
        return;
      }
    }

    sessionStorage.setItem('homeState', newState);
    this.homeState.set(newState);
    if (this.redirect()) this.redirectToHome();
  }

  /**
   * Phone: swipe left to open the profile, swipe right to go back to where we came from
   * (the groups list, or the group we were in). Unlike the home button, swiping right
   * inside a group does nothing, so a double swipe never jumps to the groups list.
   */
  private listenForSwipes(): void {
    let start: { x: number; y: number } | null = null;

    const onStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      // Ignore gestures in form fields and overlays (modals, settings panel, GIF picker).
      if (event.touches.length !== 1 || target.closest('input, textarea, select, .modal, .settings-panel, app-gif-picker')) {
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

      const state = this.homeState();
      if (dx < 0 && (state === 'groups' || state === 'group')) this.changeHomeState('account');
      else if (dx > 0 && state === 'account') this.changeHomeState('groups');
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    });
  }

  private redirectToHome(): void {
    this.router.navigate(['/']);
  }
}