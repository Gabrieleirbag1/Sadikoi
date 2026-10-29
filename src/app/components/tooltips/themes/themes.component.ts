import { ChangeDetectionStrategy, Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';

interface ThemeOption {
  id: string;
  fr: string;
  en: string;
  checked: boolean;
}

/** The question themes of a group, as chips that wrap: all of them are visible at once, no popover. */
@Component({
  selector: 'app-themes',
  imports: [TranslatePipe],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemesComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);
  private readonly translate = inject(TranslateService);

  public readonly disabled = input(false);
  public readonly selectedThemes = model<string[]>([]);
  protected readonly themes = signal<ThemeOption[]>([]);
  protected readonly selectedThemeCount = computed(() => this.selectedThemes().length);
  private readonly lang = toSignal(this.translate.onLangChange.pipe(map(event => event.lang)), {
    initialValue: this.translate.getCurrentLang() ?? 'en',
  });

  async ngOnInit(): Promise<void> {
    const themes = await firstValueFrom(
      this.httpClient.get<Record<string, ThemeOption>>('/data/question_themes.json')
    );
    const options = Object.values(themes);
    this.themes.set(options);

    if (this.selectedThemes().length === 0) {
      this.selectedThemes.set(options.filter(theme => theme.checked).map(theme => theme.id));
    }
  }

  protected label(theme: ThemeOption): string {
    return this.lang() === 'fr' ? theme.fr : theme.en;
  }

  protected isSelected(themeId: string): boolean {
    return this.selectedThemes().includes(themeId);
  }

  protected toggleTheme(themeId: string, checked: boolean): void {
    const selectedThemes = this.selectedThemes();
    // A group always keeps at least one theme.
    if (!checked && selectedThemes.length === 1) return;

    this.selectedThemes.set(
      checked
        ? [...selectedThemes, themeId]
        : selectedThemes.filter(selectedTheme => selectedTheme !== themeId)
    );
  }
}
