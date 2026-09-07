import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket = io('http://localhost:5000');

  joinGroup(groupId: string, username: string) {
    this.socket.emit('join_group', { groupId, username });
  }

  // Écoute un événement et le renvoie sous forme d'Observable RxJS
  listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: T) => subscriber.next(data));
      return () => this.socket.off(eventName);
    });
  }

  // Envoie une modification
  sendUpdate(groupId: string, patch: any) {
    this.socket.emit('update_page_data', { groupId, patch });
  }
}