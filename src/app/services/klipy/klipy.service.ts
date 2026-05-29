import { inject, Injectable } from '@angular/core';
import { secrets } from '../../../environments/secrets';
import { LoggerService } from '../logger/logger.service';

interface KlipyGifProperties {
  url: string;
  height: number;
  size: number;
  width: number;
}

interface KlipyFile {
  hd: {gif: KlipyGifProperties, jpg: KlipyGifProperties, mp4: KlipyGifProperties, webm: KlipyGifProperties, webp: KlipyGifProperties},
  md: {gif: KlipyGifProperties, jpg: KlipyGifProperties, mp4: KlipyGifProperties, webm: KlipyGifProperties, webp: KlipyGifProperties}, 
  xs: {gif: KlipyGifProperties, jpg: KlipyGifProperties, mp4: KlipyGifProperties, webm: KlipyGifProperties, webp: KlipyGifProperties},
  sm: {gif: KlipyGifProperties, jpg: KlipyGifProperties, mp4: KlipyGifProperties, webm: KlipyGifProperties, webp: KlipyGifProperties};
}
export interface KlipyGif {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  file: KlipyFile;
  type: "gif";
}

@Injectable({ providedIn: 'root' })
export class KlipyService {
  private readonly logger = inject(LoggerService);
  private readonly base = `https://api.klipy.com/api/v1/${secrets.klipyApiKey}/gifs`;
  private user: User | null = null;

  constructor() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  public async getTrending(): Promise<KlipyGif[]> {
    try {
      const res = await fetch(`${this.base}/trending`);
      const json = await res.json();
      return json?.data?.data ?? [];
    } catch (error) {
      this.logger.error('Error fetching trending GIFs:', error);
      return [];
    }
  }

  public async getRecent(): Promise<KlipyGif[]> {
    try {
      const params = new URLSearchParams({ per_page: '50' });
      const res = await fetch(`${this.base}/recent/${this.user?.id}?${params}`);
      const json = await res.json();
      return json?.data?.data ?? [];
    } catch (error) {
      this.logger.error('Error fetching recent GIFs:', error);
      return [];
    }
  }

  public async searchGifs(query: string): Promise<KlipyGif[]> {
    try {
      const params = new URLSearchParams({ q: query, per_page: '50', content_filter: 'off', customer_id: this.user?.id as unknown as string});
      const res = await fetch(`${this.base}/search?${params}`);
      const json = await res.json();
      return json?.data?.data ?? [];
    } catch (error) {
      this.logger.error('Error searching GIFs:', error);
      return [];
    }
  }

  public async shareGif(gif: KlipyGif): Promise<void> {
    try {
      const gifSlug = gif.slug;
      await fetch(`${this.base}/share/${gifSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: `${this.user?.id}` }),
      });
    } catch (error) {
      this.logger.error('Error sharing GIF:', error);
    }
  }

  public getPreviewUrl(gif: KlipyGif): string {
    return gif.file.xs.gif.url;
  }

  public getFullUrl(gif: KlipyGif): string {
    return gif.file.hd.gif.url;
  }
}