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

  /** Opens the profile tab, set by the bottom menu bar on the pages that have one (home and group). */
  private profileOpener: (() => void) | null = null;
  /** The profile was opened from the settings: it slides in (once). */
  private profileEntrance = false;

  /** Returns the function that removes it again (only if no other page replaced it meanwhile). */
  setProfileOpener(open: () => void): () => void {
    this.profileOpener = open;
    return () => {
      if (this.profileOpener === open) this.profileOpener = null;
    };
  }

  /** False when no page on screen can open the profile itself. */
  openProfile(): boolean {
    if (!this.profileOpener) return false;
    this.profileOpener();
    return true;
  }

  markProfileEntrance(): void {
    this.profileEntrance = true;
  }

  takeProfileEntrance(): boolean {
    const entrance = this.profileEntrance;
    this.profileEntrance = false;
    return entrance;
  }
}
