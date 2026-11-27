import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger/logger.service';
import { WebsocketService } from '../websocket/websocket.service';

interface Blocks {
  blocked: number[];
  blocked_by: number[];
}

/**
 * Users blocked by the connected user, and users who blocked them.
 * - Someone I blocked: their chat messages are masked, a tap shows them.
 * - Someone who blocked me: their messages are replaced by "This user blocked you".
 * Also holds the user shown in the block confirmation modal (mounted once in app.html).
 */
@Injectable({ providedIn: 'root' })
export class BlockUserService {
  private readonly httpClient = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);
  private listening = false;
  private readonly url = `${environment.apiUrl}auth/security/blocks/`;

  private readonly _blocked = signal<ReadonlySet<number>>(new Set());
  private readonly _blockedBy = signal<ReadonlySet<number>>(new Set());
  private readonly _target = signal<User | null>(null);
  public readonly blocked = this._blocked.asReadonly();
  public readonly blockedBy = this._blockedBy.asReadonly();
  /** The user the confirmation modal asks about. */
  public readonly target = this._target.asReadonly();

  /**
   * Fetches the blocks. The first call also starts listening to 'blocks_changed' (sent to both users on a block or
   * unblock), so an open chat updates on the other side too, and on my other devices. Not done in the constructor:
   * the modal in app.html creates this service at launch, and the socket must only connect once logged in.
   */
  public async load(): Promise<void> {
    if (!this.listening) {
      this.listening = true;
      this.injector.get(WebsocketService).listen('blocks_changed').subscribe(() => this.load());
    }
    try {
      const response = await firstValueFrom(this.httpClient.get<ApiResponse>(this.url, { withCredentials: true }));
      const blocks = response.content as Blocks;
      this._blocked.set(new Set(blocks.blocked));
      this._blockedBy.set(new Set(blocks.blocked_by));
    } catch (error) {
      this.logger.error('Failed to load blocked users:', error);
    }
  }

  public async block(user: User): Promise<boolean> {
    try {
      await firstValueFrom(this.httpClient.put<ApiResponse>(`${this.url}${user.id}`, {}, { withCredentials: true }));
      this._blocked.update(ids => new Set(ids).add(user.id));
      return true;
    } catch (error) {
      this.logger.error('Failed to block user:', error);
      return false;
    }
  }

  public async unblock(user: User): Promise<boolean> {
    try {
      await firstValueFrom(this.httpClient.delete<ApiResponse>(`${this.url}${user.id}`, { withCredentials: true }));
      this._blocked.update(ids => {
        const next = new Set(ids);
        next.delete(user.id);
        return next;
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to unblock user:', error);
      return false;
    }
  }

  public open(user: User): void {
    this._target.set(user);
  }

  public close(): void {
    this._target.set(null);
  }
}
