import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';

/** After this long in the background, the connection is assumed dead (the server drops it after ~45 s
 *  without pings, and a sleeping phone sends none): reconnect at once instead of waiting for socket.io to notice. */
const STALE_AFTER_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly logger = inject(LoggerService);
  private readonly socket: Socket = io(environment.apiUrl.replace(/api\/?$/, ''), { withCredentials: true });

  /** Groups whose room we are in. Rooms belong to one connection on the server: they are joined again after each reconnection. */
  private readonly joinedGroups = new Set<string>();
  private hasConnectedOnce = false;
  private hiddenSince: number | null = null;

  private readonly reconnectedSubject = new Subject<void>();
  /** Emits after a reconnection: events sent while offline are lost, so pages reload their data. */
  public readonly reconnected$ = this.reconnectedSubject.asObservable();

  constructor() {
    this.socket.on('connect', () => {
      this.logger.debug('Socket connected');
      for (const groupId of this.joinedGroups) {
        this.socket.emit('join_group', { groupId });
      }
      if (this.hasConnectedOnce) {
        this.logger.info('Socket reconnected, rejoined groups:', [...this.joinedGroups]);
        this.reconnectedSubject.next();
      }
      this.hasConnectedOnce = true;
    });
    this.socket.on('disconnect', (reason) => this.logger.debug('Socket disconnected:', reason));
    this.socket.on('connect_error', (error) => this.logger.error('Socket connection error:', error));

    this.watchForeground();
  }

  joinGroup(groupId: string) {
    this.joinedGroups.add(groupId);
    // Not connected yet: the 'connect' handler joins it.
    if (this.socket.connected) {
      this.socket.emit('join_group', { groupId });
    } else {
      this.ensureConnected();
    }
  }

  leaveGroup(groupId: string) {
    this.joinedGroups.delete(groupId);
    if (this.socket.connected) {
      this.socket.emit('leave_group', { groupId });
    }
  }

  listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      const handler = (data: T) => subscriber.next(data);
      this.socket.on(eventName, handler);
      // Only this listener: other subscribers to the same event keep theirs.
      return () => this.socket.off(eventName, handler);
    });
  }

  /** Starts a connection if none is open or in progress (socket.io gives up after the server refuses one). */
  private ensureConnected(): void {
    if (!this.socket.connected && !this.socket.active) {
      this.socket.connect();
    }
  }

  /** Phone locked or app in the background, then back: reconnect right away. */
  private watchForeground(): void {
    const onHidden = () => {
      this.hiddenSince ??= Date.now();
    };
    const onVisible = () => {
      const hiddenFor = this.hiddenSince === null ? 0 : Date.now() - this.hiddenSince;
      this.hiddenSince = null;
      if (!this.socket.connected) {
        this.logger.debug('Back in the foreground, socket not connected: connecting');
        this.socket.connect();
      } else if (hiddenFor > STALE_AFTER_MS) {
        // It may look connected while the server already closed it: start a fresh connection.
        this.logger.debug(`Back in the foreground after ${Math.round(hiddenFor / 1000)} s: reconnecting`);
        this.socket.disconnect().connect();
      }
    };

    if (Capacitor.isNativePlatform()) {
      App.addListener('pause', onHidden);
      App.addListener('resume', onVisible);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? onHidden() : onVisible()));
    window.addEventListener('online', () => this.ensureConnected());
  }
}
