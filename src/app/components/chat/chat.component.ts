import { afterNextRender, Component, HostListener, computed, DestroyRef, effect, ElementRef, inject, Injector, input, model, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService } from '../../services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { GifPickerComponent } from '../gif-picker/gif-picker.component';
import { KlipyGif, KlipyService } from '../../services/klipy/klipy.service';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { ProfileImagePickerComponent } from '../profile-image-picker/profile-image-picker.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ReportUserService } from '../../services/report-user/report-user.service';
import { UserProfileService } from '../../services/user-profile/user-profile.service';
import { UserProfileComponent } from '../tooltips/user-profile/user-profile.component';

/** Set on <html> while the user writes in the chat: on phones, styles.css then hides the bubbles and the bottom menu bar. */
const TYPING_CLASS = 'chat-typing';
/** Approximate profile card size, only used to decide when to flip it away from an edge. */
const PROFILE_WIDTH = 280;
const PROFILE_HEIGHT = 180;

@Component({
  selector: 'app-chat',
  imports: [CommonModule, GifPickerComponent, ProfileImagePickerComponent, TranslatePipe, UserProfileComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css', '../tooltips/user-profile/user-profile-tooltip.css'],
})
export class ChatComponent {
  private readonly logger = inject(LoggerService);
  private readonly chatService = inject(ChatService);
  private readonly klipyService = inject(KlipyService);
  private readonly websocketService = inject(WebsocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly translate = inject(TranslateService);
  private readonly reportUserService = inject(ReportUserService);
  protected readonly userProfileService = inject(UserProfileService);
  protected readonly profileScope = 'chat';

  protected messages = signal<Message[]>([]);
  protected showGifPicker = signal(false);
  /** Focus is in the input area (message input or GIF search). */
  protected readonly inputFocused = signal(false);
  /** Writing a message or picking a GIF: the chat gets the whole screen on phones. */
  private readonly typing = computed(() => !this.readOnly() && (this.inputFocused() || this.showGifPicker()));

  /** Follow new content at the bottom. Only the user scrolling up turns it off: smooth scrolls and
   *  late-loading GIFs move the position without that being a choice to leave the bottom. */
  private stickToBottom = true;
  private lastScrollTop = 0;
  private readonly messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');
  private readonly chatContainer = viewChild<ElementRef<HTMLElement>>('chatContainer');

  /** Author whose profile card is open (clicked avatar). */
  protected readonly profileUser = signal<User | null>(null);
  /** Card position inside .chat-container, next to the clicked avatar. */
  protected readonly profilePos = signal({ x: 0, y: 0, flipX: false, flipY: false });

  private readonly connectedUser: User = JSON.parse(localStorage.getItem('user') || '{}');

  public readonly group = model<Group | null>(null);
  /** The question whose day's messages are displayed; null/undefined means the current one. */
  public readonly question = input<Question | null>(null);
  /** True when the displayed day is not the current one: messages can be read but not sent. */
  public readonly readOnly = input(false);
  // computed so that vote updates (same id) don't trigger a reload
  private readonly questionId = computed(() => this.question()?.id);

  constructor() {
    effect(() => document.documentElement.classList.toggle(TYPING_CLASS, this.typing()));
    this.destroyRef.onDestroy(() => {
      document.documentElement.classList.remove(TYPING_CLASS);
      this.userProfileService.hide(this.profileScope);
    });

    effect(() => {
      const g = this.group();
      const questionId = this.questionId();
      // Another day or group: the open card belongs to a thread that is going away.
      untracked(() => this.closeProfile());
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

    // Messages sent while disconnected (phone asleep...) never arrived: reload the day.
    this.websocketService.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const g = this.group();
      if (g && !this.readOnly()) this.loadMessages(g.id, this.questionId());
    });
  }

  private async loadMessages(groupId: number, questionId?: number): Promise<void> {
    try {
      const response = await this.chatService.getMessages(groupId, questionId);
      // ignore a stale response if another day was selected meanwhile
      if (questionId !== this.questionId()) return;
      // Opening a thread starts at the bottom, without animation.
      this.stickToBottom = true;
      this.messages.set(response);
      afterNextRender(() => this.scrollToBottom('instant'), { injector: this.injector });
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
  protected closeOnOutsideClick(event: Event): void {
    // composedPath is fixed at dispatch time, so it stays valid even if the click removed its target
    const path = event.composedPath().filter((el): el is Element => el instanceof Element);
    if (this.showGifPicker() && !path.some(el => el.tagName === 'APP-GIF-PICKER' || el.classList.contains('gif-btn'))) {
      this.showGifPicker.set(false);
    }
    if (this.profileUser() && !path.some(el => el.classList.contains('chat-profile-popover') || el.classList.contains('chat-avatar-btn'))) {
      this.closeProfile();
    }
  }

  @HostListener('document:keydown.escape')
  protected closeProfileOnEscape(): void {
    this.closeProfile();
  }

  /** Clicking an author's picture opens their profile card; clicking it again closes it. */
  protected toggleProfile(sender: User, event: MouseEvent): void {
    if (this.profileUser()?.id === sender.id && this.userProfileService.isOpenFor(sender, this.profileScope)) {
      this.closeProfile();
      return;
    }
    // The message only carries the basic user: the group member also has items and role.
    const user = this.group()?.users.find(u => u.id === sender.id) ?? sender;
    const container = this.chatContainer()?.nativeElement;
    const avatar = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (container) {
      const box = container.getBoundingClientRect();
      const left = avatar.left - box.left, right = avatar.right - box.left;
      const top = avatar.top - box.top, bottom = avatar.bottom - box.top;
      // Own messages have the picture on the right: the card opens towards the left.
      const flipX = left + PROFILE_WIDTH > box.width && right > PROFILE_WIDTH / 2;
      const flipY = bottom + PROFILE_HEIGHT > box.height && top > PROFILE_HEIGHT;
      this.profilePos.set({ x: flipX ? right : left, y: flipY ? top : bottom, flipX, flipY });
    }
    this.profileUser.set(user);
    this.userProfileService.showNow(user, this.profileScope);
  }

  protected closeProfile(): void {
    if (!this.profileUser()) return;
    this.userProfileService.hide(this.profileScope);
    this.profileUser.set(null);
  }

  protected onInputAreaFocusOut(event: FocusEvent): void {
    // Focus moving inside the area (input -> GIF search) is still typing.
    const area = event.currentTarget as HTMLElement;
    if (!area.contains(event.relatedTarget as Node | null)) this.inputFocused.set(false);
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
    if (!el) return;
    if (el.scrollTop < this.lastScrollTop - 2) {
      this.stickToBottom = false;
    }
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      this.stickToBottom = true;
    }
    this.lastScrollTop = el.scrollTop;
  }

  // Only follow new content if the user hasn't scrolled up.
  protected autoScroll(behavior: ScrollBehavior = 'smooth'): void {
    if (this.stickToBottom) this.scrollToBottom(behavior);
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

  protected reportMessage(message: Message): void {
    const group = this.group();
    this.reportUserService.open(message.sender, `[group: ${group?.name ?? ''}, message: ${message.id}]`, group?.id, message.id);
  }

  protected isGifMessage(content: string): boolean {
    return content.startsWith('https://') && content.includes('klipy');
  }
}