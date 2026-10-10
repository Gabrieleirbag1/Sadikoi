import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly isOpen = signal(false);
  readonly feedbackOpen = signal(false);

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
}
