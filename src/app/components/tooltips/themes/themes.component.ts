import { ChangeDetectionStrategy, Component, computed, inject, model, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ThemeOption {
  id: string;
  fr: string;
  en: string;
  checked: boolean;
}

@Component({
  selector: 'app-themes',
  imports: [],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemesComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);

  public readonly selectedThemes = model<string[]>([]);
  protected readonly themes = signal<ThemeOption[]>([]);
  protected readonly isOpen = signal(false);
  protected readonly selectedThemeCount = computed(() => this.selectedThemes().length);

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

  protected toggle(): void {
    this.isOpen.update(open => !open);
  }

  protected toggleTheme(themeId: string, checked: boolean): void {
    const selectedThemes = this.selectedThemes();
    if (!checked && selectedThemes.length === 1) return;

    this.selectedThemes.set(
      checked
        ? [...selectedThemes, themeId]
        : selectedThemes.filter(selectedTheme => selectedTheme !== themeId)
    );
  }
}
