import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DatetimeService {

  public convertUTCTimeStampToLocal(time: string): string {
    const [hours, minutes, seconds = '00'] = time.split(':');
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes), Number(seconds)));

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  public convertLocalTimestampToUtc(time: string): string {
    const [hours, minutes] = time.split(':');
    const now = new Date();

    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes));

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  public convertUTCDateToLocal(date: string): string {
    const utcDate = new Date(date);
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
  }

}
