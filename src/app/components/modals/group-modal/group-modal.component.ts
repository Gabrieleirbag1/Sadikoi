import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ModalConfig, ModalService } from '../../../services/modal/modal.service';
import { TranslatePipe } from '@ngx-translate/core';
import { JoinGroupComponent } from '../../join-group/join-group.component';
import { DatetimeService } from '../../../services/datetime/datetime.service';

type GroupModalState = 'chose' | 'create' | 'join';

interface ThemeOption {
  id: string;
  fr: string;
  en: string;
  checked: boolean;
}

@Component({
  selector: 'app-group-modal',
  imports: [TranslatePipe, JoinGroupComponent],
  templateUrl: './group-modal.component.html',
  styleUrl: './group-modal.component.css',
})
export class GroupModalComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);
  private readonly modalService = inject(ModalService);
  private readonly datetimeService = inject(DatetimeService);
  private readonly modalId = 'group-modal';
  
  protected readonly defaultTimeValue = this.datetimeService.convertUTCTimeStampToLocal("15:00:00");
  protected readonly themes = signal<ThemeOption[]>([]);
  protected readonly selectedThemeCount = computed(() => this.themes().filter(theme => theme.checked).length);

  protected state: GroupModalState = 'chose';
  protected groupName = viewChild<ElementRef<HTMLInputElement>>('groupName');
  protected groupDescription = viewChild<ElementRef<HTMLInputElement>>('groupDescription');
  protected groupTime = viewChild<ElementRef<HTMLInputElement>>('groupTime');

  async ngOnInit(): Promise<void> {
    const themes = await firstValueFrom(this.httpClient.get<Record<string, ThemeOption>>('/data/question_themes.json'));
    this.themes.set(Object.values(themes));
  }

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
    this.state = 'chose';
  }

  protected save(): void {
    const saveFn = this.config().save;
    this.modalService.close(this.modalId);
    saveFn?.({
      name: this.groupName()?.nativeElement.value ?? '',
      description: this.groupDescription()?.nativeElement.value ?? '',
      time: this.groupTime()?.nativeElement.value ?? '15:00:00',
      themes: this.themes().filter(theme => theme.checked).map(theme => theme.id)
    });
    this.state = 'chose';
  }

  protected toggleTheme(themeId: string, checked: boolean): void {
    const selectedThemes = this.themes().filter(theme => theme.checked);
    if (!checked && selectedThemes.length === 1) return;

    this.themes.update(themes => themes.map(theme =>
      theme.id === themeId ? { ...theme, checked } : theme
    ));
  }

  protected changeGroupModalState(newState: GroupModalState): void {
    this.state = newState;
  }
}