import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title?: string;
  description?: string;
  save?: (event: Event) => void;
  discard?: (event: Event) => void;
}

const DEFAULT_CONFIG: ModalConfig = {
  title: '',
  description: '',
};

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private readonly _isOpen = signal(false);
  private readonly _config = signal<ModalConfig>(DEFAULT_CONFIG);

  readonly isOpen = this._isOpen.asReadonly();
  readonly config = this._config.asReadonly();

  open(config: ModalConfig): void {
    console.log('ModalService: Opening modal with config:', config);
    this._config.set({ ...DEFAULT_CONFIG, ...config });
    this._isOpen.set(true);
    console.log('ModalService: Modal is now open:', this._isOpen());
  }

  close(): void {
    this._isOpen.set(false);
    console.log('ModalService: Modal is now closed:', this._isOpen());
  }
}