import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

const MAX_TOASTS = 5;
const ERROR_DURATION = 5000;
const SUCCESS_DURATION = 3000;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  public showError(message: string, duration = ERROR_DURATION): void {
    this.add('error', message, duration);
  }

  public showSuccess(message: string, duration = SUCCESS_DURATION): void {
    this.add('success', message, duration);
  }

  public dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  private add(type: ToastType, message: string, duration: number): void {
    if (this._toasts().some(toast => toast.type === type && toast.message === message)) {
      return;
    }
    const toast: Toast = { id: this.nextId++, type, message, duration };
    this._toasts.update(toasts => [...toasts, toast].slice(-MAX_TOASTS));
  }
}
