import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DatetimeService {

  public convertUTCTimeStampToLocal(time: string): string {
    if (!time?.trim()) return '';

    const [hours, minutes, seconds = '00'] = time.split(':');
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes), Number(seconds)));

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  public convertLocalTimestampToUtc(time: string): string {
    if (!time?.trim()) return '';

    const [hours, minutes] = time.split(':');
    const now = new Date();

    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes));

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  public convertUTCDateToLocal(date: string): string {
    if (!date?.trim()) return '';

    const trimmed = date.trim();
    const hasTz = /Z$|[+-]\d{2}:\d{2}$/.test(trimmed);
    const normalized = hasTz ? trimmed : `${trimmed}Z`;

    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return '';

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

}
