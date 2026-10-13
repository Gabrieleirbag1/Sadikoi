import { Injectable, signal } from '@angular/core';

export interface ReportTarget {
  user: User;
  context?: string;
  groupId?: number;
  messageId?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportUserService {
  private readonly _target = signal<ReportTarget | null>(null);
  public readonly target = this._target.asReadonly();

  public open(user: User, context?: string, groupId?: number, messageId?: number): void {
    this._target.set({ user, context, groupId, messageId });
  }

  public close(): void {
    this._target.set(null);
  }
}
