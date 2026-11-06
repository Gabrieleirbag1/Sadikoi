import { Injectable } from '@angular/core';

/**
 * Home <-> profile slide. Whoever switches the view (bottom bar, swipe, settings, back button) marks the
 * view it goes to; that view slides in when it appears. A page opened any other way (app start,
 * reload, link) just appears.
 */
@Injectable({ providedIn: 'root' })
export class HomeTransitionService {
  private pending: HomeState | null = null;

  public mark(state: HomeState): void {
    this.pending = state;
  }

  /** True once, for the view that was marked. */
  public take(state: HomeState): boolean {
    if (this.pending !== state) return false;
    this.pending = null;
    return true;
  }
}
