import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  private readonly httpClient = inject(HttpClient);
  // Klipy is called by the API (it holds the key): the browser never sees it.
  private readonly base = `${environment.apiUrl}gifs/`;

  public async getTrending(): Promise<KlipyGif[]> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${this.base}trending/`, { withCredentials: true }));
      return response.content ?? [];
    } catch (error) {
      this.logger.error('Error fetching trending GIFs:', error);
      return [];
    }
  }

  public async getRecent(): Promise<KlipyGif[]> {
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${this.base}recent/`, { withCredentials: true }));
      return response.content ?? [];
    } catch (error) {
      this.logger.error('Error fetching recent GIFs:', error);
      return [];
    }
  }

  public async searchGifs(query: string): Promise<KlipyGif[]> {
    try {
      const params = new HttpParams().set('q', query);
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(`${this.base}search/`, { params, withCredentials: true }));
      return response.content ?? [];
    } catch (error) {
      this.logger.error('Error searching GIFs:', error);
      return [];
    }
  }

  public async shareGif(gif: KlipyGif): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.post<ApiResponse>(`${this.base}share/${encodeURIComponent(gif.slug)}/`, {}, { withCredentials: true }));
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