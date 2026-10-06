import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  protected readonly activeUser = signal<User | null>(null);
  protected readonly activeScope = signal<string | null>(null);
  protected readonly open = signal(false);
  private hoverTimeout: any;

  public show(user: User, scope: string): void {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(() => {
        this.activeUser.set(user);
        this.activeScope.set(scope);
        this.open.set(true);
    }, 1000);
  }

  /** Opens immediately (e.g. on click), cancelling any pending delayed hover. */
  public showNow(user: User, scope: string): void {
    clearTimeout(this.hoverTimeout);
    this.activeUser.set(user);
    this.activeScope.set(scope);
    this.open.set(true);
  }

  public hide(scope: string): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    if (this.activeScope() !== scope) {
      return;
    }

    this.open.set(false);
    this.activeUser.set(null);
    this.activeScope.set(null);
  }

  public isOpen(): boolean {
    return this.open();
  }

  public isOpenFor(user: User | null | undefined, scope: string): boolean {
    return !!user && this.open() && this.activeScope() === scope && this.activeUser()?.id === user.id;
  }
}