import { Injectable, signal } from '@angular/core';

export interface ReportTarget {
  user: User;
  /** Extra info prepended to the reason (e.g. the reported message). */
  context?: string;
}

/** Holds the user currently being reported; rendered by the single app-level report-user modal. */
@Injectable({ providedIn: 'root' })
export class ReportUserService {
  private readonly _target = signal<ReportTarget | null>(null);
  public readonly target = this._target.asReadonly();

  public open(user: User, context?: string): void {
    this._target.set({ user, context });
  }

  public close(): void {
    this._target.set(null);
  }
}
