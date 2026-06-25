import { Component, computed, inject } from '@angular/core';
import { ModalService } from '../../services/modal/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  private readonly modalService = inject(ModalService);

  constructor() {
    console.log('ModalComponent: isOpen signal:', this.modalService.isOpen());
    console.log('ModalComponent: config signal:', this.modalService.config());
  }

  readonly isOpen = this.modalService.isOpen;
  readonly config = this.modalService.config;

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close();
    discardFn?.(event);
  }

  protected save(event: Event): void {
    const saveFn = this.config().save;
    this.modalService.close();
    saveFn?.(event);
  }
}