import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.development';
import { LoggerService } from '../logger/logger.service';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly logger = inject(LoggerService);
  private readonly socket: Socket = io(environment.apiUrl.replace(/api\/?$/, ''), { withCredentials: true });

  constructor() {
    this.socket.on('connect', () => this.logger.debug('Socket connected'));
    this.socket.on('disconnect', () => this.logger.debug('Socket disconnected'));
    this.socket.on('connect_error', (error) => this.logger.error('Socket connection error:', error));
  }

  joinGroup(groupId: string) {
    this.socket.emit('join_group', { groupId });
  }

  leaveGroup(groupId: string) {
    this.socket.emit('leave_group', { groupId });
  }

  listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: T) => subscriber.next(data));
      return () => this.socket.off(eventName);
    });
  }
}
