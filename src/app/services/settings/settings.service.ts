import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly isOpen = signal(false);
  readonly feedbackOpen = signal(false);
  readonly donationOpen = signal(false);
  readonly notificationsOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  openFeedback(): void {
    this.isOpen.set(false);
    this.feedbackOpen.set(true);
  }

  closeFeedback(): void {
    this.feedbackOpen.set(false);
  }

  openDonation(): void {
    this.isOpen.set(false);
    this.donationOpen.set(true);
  }

  closeDonation(): void {
    this.donationOpen.set(false);
  }

  openNotifications(): void {
    this.isOpen.set(false);
    this.notificationsOpen.set(true);
  }

  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  /** Switches the home tab (groups list or profile), set by the bottom menu bar on the pages that have one (home and group). */
  private homeNavigator: ((state: 'groups' | 'account') => void) | null = null;

  /** Returns the function that removes it again (only if no other page replaced it meanwhile). */
  setHomeNavigator(go: (state: 'groups' | 'account') => void): () => void {
    this.homeNavigator = go;
    return () => {
      if (this.homeNavigator === go) this.homeNavigator = null;
    };
  }

  /** False when no page on screen can switch the home tab itself. */
  goHome(state: 'groups' | 'account'): boolean {
    if (!this.homeNavigator) return false;
    this.homeNavigator(state);
    return true;
  }
}
