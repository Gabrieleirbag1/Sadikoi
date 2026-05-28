import { Injectable } from '@angular/core';
import { secrets } from '../../../environments/secrets'

export interface KlipyGif {
  id: string;
  title: string;
  slug: string;
  file: any;
}

@Injectable({ providedIn: 'root' })
export class KlipyService {
  private readonly base = `https://api.klipy.com/api/v1/${secrets.klipyApiKey}/gifs`;

  async getTrending(): Promise<KlipyGif[]> {
    const res = await fetch(`${this.base}/trending`);
    const json = await res.json();
    return json?.data?.data ?? [];
  }

  async search(query: string): Promise<KlipyGif[]> {
    const params = new URLSearchParams({ q: query, per_page: '24' });
    const res = await fetch(`${this.base}/search?${params}`);
    const json = await res.json();
    return json?.data?.data ?? [];
  }

  getPreviewUrl(gif: KlipyGif): string {
    return gif.file.hd.gif.url;
  }

  getFullUrl(gif: KlipyGif): string {
    return gif.file.hd.gif.url;
  }
}