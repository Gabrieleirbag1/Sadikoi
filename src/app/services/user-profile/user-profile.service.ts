import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  protected readonly activeUser = signal<User | null>(null);
  protected readonly open = signal(false);

  public show(user: User): void {
    this.activeUser.set(user);
    this.open.set(true);
  }

  public hide(): void {
    this.open.set(false);
    this.activeUser.set(null);
  }

  public isOpen(): boolean {
    return this.open();
  }

  public isOpenFor(user: User | null | undefined): boolean {
    return !!user && this.open() && this.activeUser()?.id === user.id;
  }
}