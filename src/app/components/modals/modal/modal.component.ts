import { Component, inject, input } from '@angular/core';
import { ModalConfig, ModalService } from '../../../services/modal/modal.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-modal',
  imports: [TranslatePipe],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  private readonly modalService = inject(ModalService);

  public readonly id = input.required<string>();

  protected isOpen(): boolean {
    return this.modalService.isOpen(this.id());
  }

  protected config(): ModalConfig {
    return this.modalService.config(this.id());
  }

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close(this.id());
    discardFn?.(event);
  }

  protected save(event: Event): void {
    const saveFn = this.config().save;
    this.modalService.close(this.id());
    saveFn?.(event);
  }
}
