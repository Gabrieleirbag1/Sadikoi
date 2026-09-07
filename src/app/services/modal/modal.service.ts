import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title?: string;
  description?: string;
  save?: (data?: any) => void;
  discard?: (event?: Event) => void;
}

interface ModalState {
  isOpen: boolean;
  config: ModalConfig;
}

const DEFAULT_CONFIG: ModalConfig = {
  title: '',
  description: '',
};

const DEFAULT_STATE: ModalState = {
  isOpen: false,
  config: DEFAULT_CONFIG,
};

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private readonly _modals = signal<Record<string, ModalState>>({});

  open(id: string, config: ModalConfig): void {
    this._modals.update(modals => ({
      ...modals,
      [id]: { isOpen: true, config: { ...DEFAULT_CONFIG, ...config } },
    }));
  }

  close(id: string): void {
    this._modals.update(modals => ({
      ...modals,
      [id]: { ...(modals[id] ?? DEFAULT_STATE), isOpen: false },
    }));
  }

  isOpen(id: string): boolean {
    return this._modals()[id]?.isOpen ?? false;
  }

  config(id: string): ModalConfig {
    return this._modals()[id]?.config ?? DEFAULT_CONFIG;
  }
}
