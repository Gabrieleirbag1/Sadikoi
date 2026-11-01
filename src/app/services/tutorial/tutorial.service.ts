import { Injectable } from '@angular/core';

/** The tutorial popups, each shown once per account. */
export type TutorialStep = 'welcome' | 'vote' | 'results';

/** The welcome popup is for accounts created this recently (first login right after signing up). */
const NEW_ACCOUNT_MS = 24 * 60 * 60 * 1000;

/** Remembers, per account and in localStorage, which tutorial popups were already shown. */
@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  public isSeen(step: TutorialStep): boolean {
    const key = this.key(step);
    if (!key) return true;
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      // storage unavailable: better never than at every visit
      return true;
    }
  }

  public markSeen(step: TutorialStep): void {
    const key = this.key(step);
    if (!key) return;
    try {
      localStorage.setItem(key, '1');
    } catch {
      // storage unavailable: nothing to remember it with
    }
  }

  /** First login of an account that was just created: welcome it, once. */
  public shouldWelcome(): boolean {
    const created = Date.parse(this.user()?.date_created ?? '');
    return Number.isFinite(created) && Date.now() - created < NEW_ACCOUNT_MS && !this.isSeen('welcome');
  }

  private key(step: TutorialStep): string | null {
    const id = this.user()?.id;
    return id ? `tutorial-${step}-${id}` : null;
  }

  private user(): Partial<User> | null {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }
}
