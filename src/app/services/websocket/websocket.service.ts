import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket = io('http://localhost:5000');

  listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: T) => subscriber.next(data));
      return () => this.socket.off(eventName);
    });
  }

}