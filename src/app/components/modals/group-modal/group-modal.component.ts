import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { ModalConfig, ModalService } from '../../../services/modal/modal.service';
import { TranslatePipe } from '@ngx-translate/core';
import { JoinGroupComponent } from '../../join-group/join-group.component';
import { DatetimeService } from '../../../services/datetime/datetime.service';
import { ThemesComponent } from '../../tooltips/themes/themes.component';

type GroupModalState = 'chose' | 'create' | 'join';

@Component({
  selector: 'app-group-modal',
  imports: [TranslatePipe, JoinGroupComponent, ThemesComponent],
  templateUrl: './group-modal.component.html',
  styleUrl: './group-modal.component.css',
})
export class GroupModalComponent {
  private readonly modalService = inject(ModalService);
  private readonly datetimeService = inject(DatetimeService);
  private readonly modalId = 'group-modal';
  
  protected readonly defaultTimeValue = this.datetimeService.convertUTCTimeStampToLocal("15:00:00");
  protected selectedThemes: string[] = [];
  protected nameMissing = false;

  protected state: GroupModalState = 'chose';
  protected groupName = viewChild<ElementRef<HTMLInputElement>>('groupName');
  protected groupDescription = viewChild<ElementRef<HTMLInputElement>>('groupDescription');
  protected groupTime = viewChild<ElementRef<HTMLInputElement>>('groupTime');

  protected isOpen(): boolean {
    return this.modalService.isOpen(this.modalId);
  }

  protected config(): ModalConfig {
    return this.modalService.config(this.modalId);
  }

  protected discard(event: Event): void {
    const discardFn = this.config().discard;
    this.modalService.close(this.modalId);
    discardFn?.(event);
    this.reset();
  }

  protected save(): void {
    if (!this.groupName()?.nativeElement.value.trim()) {
      this.nameMissing = true;
      this.groupName()?.nativeElement.focus();
      return;
    }
    const saveFn = this.config().save;
    this.modalService.close(this.modalId);
    saveFn?.({
      name: this.groupName()?.nativeElement.value.trim() ?? '',
      description: this.groupDescription()?.nativeElement.value ?? '',
      time: this.groupTime()?.nativeElement.value ?? '15:00:00',
      themes: this.selectedThemes
    });
    this.reset();
  }

  /** Next opening starts from scratch: first step, default themes (set again by app-themes when empty). */
  private reset(): void {
    this.state = 'chose';
    this.selectedThemes = [];
    this.nameMissing = false;
  }

  /** The configured title, otherwise one for the current step. */
  protected title(): string {
    const configured = this.config().title;
    if (configured) return configured;
    return { chose: 'groups.newGroupTitle', create: 'groups.createGroup', join: 'groups.joinAGroup' }[this.state];
  }

  protected changeGroupModalState(newState: GroupModalState): void {
    this.state = newState;
  }
}