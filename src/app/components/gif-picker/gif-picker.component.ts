import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KlipyGif, KlipyService } from '../../services/klipy/klipy.service';

@Component({
  selector: 'app-gif-picker',
  imports: [CommonModule, FormsModule],
  templateUrl: './gif-picker.component.html',
  styleUrl: './gif-picker.component.css',
})
export class GifPickerComponent {
  private readonly klipyService = inject(KlipyService);

  @Output() gifSelected = new EventEmitter<KlipyGif>();

  protected searchQuery = '';
  protected gifs = signal<KlipyGif[]>([]);
  protected loading = signal(false);
  protected searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadTrending();
  }

  protected setView(view: 'recent' | 'trending'): void {
    this.loadGifs(view);
  }

  private async loadGifs(view: 'recent' | 'trending'): Promise<void> {
    if (view === 'trending') {
      await this.loadTrending();
    } else {
      await this.loadRecent();
    }
  }

  private async loadTrending(): Promise<void> {
    this.loading.set(true);
    try {
      this.gifs.set(await this.klipyService.getTrending());
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRecent(): Promise<void> {
    this.loading.set(true);
    try {
      this.gifs.set(await this.klipyService.getRecent());
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearchInput(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.search(), 400);
  }

  protected async search(): Promise<void> {
    if (!this.searchQuery.trim()) {
      return this.loadTrending();
    }
    this.loading.set(true);
    try {
      this.gifs.set(await this.klipyService.search(this.searchQuery));
    } finally {
      this.loading.set(false);
    }
  }

  protected selectGif(gif: KlipyGif): void {
    this.gifSelected.emit(gif);
    this.klipyService.shareGif(gif).catch(err => console.error('Error sharing GIF:', err));
  }

  protected getPreviewUrl(gif: KlipyGif): string {
    console.log('Getting preview URL for GIF:', gif);
    return this.klipyService.getPreviewUrl(gif);
  }
}