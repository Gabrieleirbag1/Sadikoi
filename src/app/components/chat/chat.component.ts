import { afterNextRender, Component, HostListener, computed, DestroyRef, effect, ElementRef, inject, Injector, input, model, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService } from '../../services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { GifPickerComponent } from '../gif-picker/gif-picker.component';
import { KlipyGif, KlipyService } from '../../services/klipy/klipy.service';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, GifPickerComponent, ProfileImagePickerComponent, TranslatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  private readonly logger = inject(LoggerService);
  private readonly chatService = inject(ChatService);
  private readonly klipyService = inject(KlipyService);
  private readonly websocketService = inject(WebsocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  protected messages = signal<Message[]>([]);
  protected showGifPicker = signal(false);

  private isAtBottom = true;
  private readonly messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  private readonly connectedUser: User = JSON.parse(localStorage.getItem('user') || '{}');

  public readonly group = model<Group | null>(null);
  /** The question whose day's messages are displayed; null/undefined means the current one. */
  public readonly question = input<Question | null>(null);
  /** True when the displayed day is not the current one: messages can be read but not sent. */
  public readonly readOnly = input(false);
  // computed so that vote updates (same id) don't trigger a reload
  private readonly questionId = computed(() => this.question()?.id);

  constructor() {
    effect(() => {
      const g = this.group();
      const questionId = this.questionId();
      if (g) this.loadMessages(g.id, questionId);
    });

    effect(() => {
      this.messages();
      afterNextRender(() => this.autoScroll(), { injector: this.injector });
    });
  }

  async ngOnInit(): Promise<void> {
    this.websocketService.listen<Message>('new_message').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(message => {
      // live messages belong to the current day only
      if (this.readOnly()) return;
      if (!this.messages().some(m => m.id === message.id)) {
        this.messages.update(messages => [...messages, message]);
      }
    });
  }

  private async loadMessages(groupId: number, questionId?: number): Promise<void> {
    try {
      const response = await this.chatService.getMessages(groupId, questionId);
      // ignore a stale response if another day was selected meanwhile
      if (questionId !== this.questionId()) return;
      this.messages.set(response);
    } catch (error) {
      this.logger.error('Error loading messages:', error);
    }
  }

  protected async sendMessage(content: string, input?: HTMLInputElement): Promise<void> {
    if (!content.trim() || this.readOnly()) return;
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not set');
      const newMessage = await this.chatService.sendMessage(g.id, content, this.questionId());
      // if (newMessage) this.messages.update(messages => [...messages, newMessage]);
      if (input) input.value = '';
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeGifPickerOnOutsideClick(event: Event): void {
    if (!this.showGifPicker()) return;
    // composedPath is fixed at dispatch time, so it stays valid even if the click removed its target
    const inside = event.composedPath().some(
      el => el instanceof Element && (el.tagName === 'APP-GIF-PICKER' || el.classList.contains('gif-btn')),
    );
    if (!inside) this.showGifPicker.set(false);
  }

  protected toggleGifPicker(): void {
    this.showGifPicker.update(v => !v);
  }

  protected async onGifSelected(gif: KlipyGif | null): Promise<void> {
    if (!gif) throw new Error('No GIF selected');
    this.showGifPicker.set(false);
    const gifUrl = this.klipyService.getFullUrl(gif);
    await this.sendMessage(gifUrl);
  }

  protected onMessagesScroll(): void {
    const el = this.messagesContainer()?.nativeElement;
    if (el) this.isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  // Only follow new content if the user is already at the bottom.
  protected autoScroll(behavior: ScrollBehavior = 'smooth'): void {
    if (this.isAtBottom) this.scrollToBottom(behavior);
  }

  protected scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    const el = this.messagesContainer()?.nativeElement;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  /** Calendar day of a message, used to know where to insert a date separator. */
  protected dayKey(message: Message): string {
    return new Date(message.timestamp).toDateString();
  }

  protected isOwnMessage(message: Message): boolean {
    return message.sender.id === this.connectedUser?.id;
  }

  protected isGifMessage(content: string): boolean {
    return content.startsWith('https://') && content.includes('klipy');
  }
}