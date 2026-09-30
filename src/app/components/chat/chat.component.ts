import { afterNextRender, Component, HostListener, DestroyRef, effect, ElementRef, inject, Injector, model, signal, viewChild } from '@angular/core';
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

  constructor() {
    effect(() => {
      this.messages();
      afterNextRender(() => this.autoScroll(), { injector: this.injector });
    });
  }

  async ngOnInit(): Promise<void> {
    const g = this.group();
    if (g) this.loadMessages(g.id);

    this.websocketService.listen<Message>('new_message').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(message => {
      if (!this.messages().some(m => m.id === message.id)) {
        this.messages.update(messages => [...messages, message]);
      }
    });
  }

  private async loadMessages(groupId: number): Promise<void> {
    try {
      const response = await this.chatService.getMessages(groupId);
      this.messages.set(response);
    } catch (error) {
      this.logger.error('Error loading messages:', error);
    }
  }

  protected async sendMessage(content: string, input?: HTMLInputElement): Promise<void> {
    if (!content.trim()) return;
    try {
      const g = this.group();
      if (!g) throw new Error('Group is not set');
      const newMessage = await this.chatService.sendMessage(g.id, content);
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

  protected isOwnMessage(message: Message): boolean {
    return message.sender.id === this.connectedUser?.id;
  }

  protected isGifMessage(content: string): boolean {
    return content.startsWith('https://') && content.includes('klipy');
  }
}