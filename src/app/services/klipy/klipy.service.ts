import { Injectable } from '@angular/core';
import { secrets } from '../../../environments/secrets';

export interface KlipyGif {
  id: string;
  title: string;
  slug: string;
  file: any;
}

@Injectable({ providedIn: 'root' })
export class KlipyService {
  private readonly base = `https://api.klipy.com/api/v1/${secrets.klipyApiKey}/gifs`;
  private user: User | null = null;

  constructor() {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async getTrending(): Promise<KlipyGif[]> {
    const res = await fetch(`${this.base}/trending`);
    const json = await res.json();
    return json?.data?.data ?? [];
  }

  async getRecent(): Promise<KlipyGif[]> {
    const params = new URLSearchParams({ per_page: '50' });
    const res = await fetch(`${this.base}/recent/tititititioovekcoznclo191918zxxe?${params}`);
    console.log(`${this.base}/recent?${params}`)
    console.log(res)
    const json = await res.json();
    return json?.data?.data ?? [];
  }

  async shareGif(gif: KlipyGif): Promise<void> {
    const gifSlug = gif.slug;
    await fetch(`${this.base}/share/${gifSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: "tititititioovekcoznclo191918zxxe"}),
    });
  }

  async search(query: string): Promise<KlipyGif[]> {
    const params = new URLSearchParams({ q: query, per_page: '50', content_filter: 'off', customer_id: "tititititioovekcoznclo191918zxxe" });
    const res = await fetch(`${this.base}/search?${params}`);
    const json = await res.json();
    return json?.data?.data ?? [];
  }

  getPreviewUrl(gif: KlipyGif): string {
    return gif.file.xs.gif.url;
  }

  getFullUrl(gif: KlipyGif): string {
    return gif.file.hd.gif.url;
  }
}