import { Component, inject, viewChild, ElementRef } from '@angular/core';
import { ModalService } from '../../../services/modal/modal.service';
import { TranslatePipe } from '@ngx-translate/core';
import { JoinGroupComponent } from '../../join-group/join-group.component';
import { DatetimeService } from '../../../services/datetime/datetime.service';

type GroupModalState = 'chose' | 'create' | 'join';

@Component({
  selector: 'app-group-modal',
  imports: [TranslatePipe, JoinGroupComponent],
  templateUrl: './group-modal.component.html',
  styleUrl: './group-modal.component.css',
})
export class GroupModalComponent {
  private readonly modalService = inject(ModalService);
  private readonly datetimeService = inject(DatetimeService);

  protected readonly defaultTimeValue = this.datetimeService.convertUTCTimeStampToLocal("15:00:00");
  public readonly isOpen = this.modalService.isOpen;
  public readonly config = this.modalService.config;

  protected state: GroupModalState = 'chose';

  protected groupName = viewChild<ElementRef<HTMLInputElement>>('groupName');
  protected groupDescription = viewChild<ElementRef<HTMLInputElement>>('groupDescription');
  protected groupTime = viewChild<ElementRef<HTMLInputElement>>('groupTime');

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close();
    discardFn?.(event);
    this.state = 'chose';
  }

  protected save(): void {
    const saveFn = this.config().save;
    this.modalService.close();
    saveFn?.({
      name: this.groupName()?.nativeElement.value ?? '',
      description: this.groupDescription()?.nativeElement.value ?? '',
      time: this.groupTime()?.nativeElement.value ?? '15:00:00',
    });
    this.state = 'chose';
  }

  protected changeGroupModalState(newState: GroupModalState): void {
    this.state = newState;
  }
}