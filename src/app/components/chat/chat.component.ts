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
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/** Set on <html> while the user writes in the chat: on phones, styles.css then hides the bubbles and the bottom menu bar. */
const TYPING_CLASS = 'chat-typing';
/** Set on <html> while the chat is in full screen (phones only): styles.css then hides the bubbles. */
const FULLSCREEN_CLASS = 'chat-fullscreen';
/** Approximate profile card size, only used to decide when to flip it away from an edge. */
const PROFILE_WIDTH = 280;
const PROFILE_HEIGHT = 180;
/** Id of one sent message, so the API can recognise the same message sent twice. */
function newClientId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
/** Browser only: the visible screen shrinking by more than this (px) means the on-screen keyboard is open. */
const KEYBOARD_MIN_HEIGHT = 150;
/** Longest message the API can store (chat_messages.content is a String(500)). */
const MAX_MESSAGE_LENGTH = 500;
/** The character counter shows up from this share of the limit. */
const COUNTER_THRESHOLD = 0.8;

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
  /** Phone: the chat takes the bubbles' room. Only kept while the group is open (never saved). */
  protected readonly fullscreen = signal(false);
  /** Focus is in the input area (message input or GIF search). */
  protected readonly inputFocused = signal(false);
  protected readonly maxMessageLength = MAX_MESSAGE_LENGTH;
  /** Characters in the message being written, for the counter. */
  protected readonly messageLength = signal(0);
  protected readonly showCounter = computed(() => this.messageLength() >= MAX_MESSAGE_LENGTH * COUNTER_THRESHOLD);
  private readonly isNative = Capacitor.isNativePlatform();
  /** App only: the keyboard is open or coming up (plugin events). */
  private readonly keyboardOpen = signal(false);
  /** Writing a message or picking a GIF: the chat gets the whole screen on phones. In the app, writing
   *  waits for the keyboard to start coming up, so the chat grows with it instead of before it. */
  private readonly typing = computed(() => !this.readOnly()
    && ((this.inputFocused() && (!this.isNative || this.keyboardOpen())) || this.showGifPicker()));

  /** Follow new content at the bottom. Only the user scrolling up turns it off: smooth scrolls and
   *  late-loading GIFs move the position without that being a choice to leave the bottom. */
  private stickToBottom = true;
  private lastScrollTop = 0;
  private readonly messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');
  private readonly chatContainer = viewChild<ElementRef<HTMLElement>>('chatContainer');
  private readonly inputArea = viewChild<ElementRef<HTMLElement>>('inputArea');
  private readonly messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageContent');
  private readonly gifPicker = viewChild(GifPickerComponent);
  /** Last message that failed to send, kept to resend it with the same id. */
  private failedSend: { content: string; clientId: string } | null = null;
  /** Browser only: visible screen height when the input got the focus, before the keyboard opened. */
  private heightBeforeKeyboard = 0;
  /** Browser only: the keyboard was seen open since the input got the focus. */
  private keyboardSeen = false;

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
    effect(() => document.documentElement.classList.toggle(FULLSCREEN_CLASS, this.fullscreen()));
    // Android's back button closes the keyboard but leaves the focus in the input: the chat would
    // keep the whole screen. When the keyboard closes, we drop the focus ourselves.
    let viewport: VisualViewport | null = null;
    const onViewportResize = () => this.onViewportResize(viewport!.height);
    if (this.isNative) {
      // The app's screen resizes in several steps while the keyboard opens: only the plugin is reliable.
      // "Will show/hide" fire as the keyboard starts moving, so the layout changes with it, not before or after.
      const listeners = [
        Keyboard.addListener('keyboardWillShow', () => this.keyboardOpen.set(true)),
        Keyboard.addListener('keyboardWillHide', () => {
          this.keyboardOpen.set(false);
          this.blurInput();
        }),
      ];
      this.destroyRef.onDestroy(() => listeners.forEach(l => void l.then(h => h.remove())));
    } else {
      viewport = window.visualViewport;
      viewport?.addEventListener('resize', onViewportResize);
    }

    this.destroyRef.onDestroy(() => {
      document.documentElement.classList.remove(TYPING_CLASS, FULLSCREEN_CLASS);
      viewport?.removeEventListener('resize', onViewportResize);
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

    // The thread changes height (full screen animation, keyboard): stay on the latest messages.
    afterNextRender(() => {
      const el = this.messagesContainer()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.autoScroll('instant'));
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
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

  protected async sendMessage(content: string, input?: HTMLInputElement | HTMLTextAreaElement): Promise<void> {
    // Spaces and blank lines around the message are dropped, like Discord.
    content = content.trim();
    if (!content || this.readOnly()) return;
    const g = this.group();
    if (!g) {
      this.logger.error('Error sending message: group is not set');
      return;
    }
    // Sending the message that just failed again: same id, so if the first try did reach the server
    // it isn't stored twice.
    const clientId = this.failedSend?.content === content ? this.failedSend.clientId : newClientId();
    this.failedSend = null;
    // Emptied right away: a second tap on "send" finds nothing to send.
    if (input) {
      input.value = '';
      this.onInputChange(input);
    }
    const sent = await this.chatService.sendMessage(g.id, content, this.questionId(), clientId);
    if (!sent) {
      this.failedSend = { content, clientId };
      // Give the text back to retry, unless something new was typed meanwhile.
      if (input && !input.value) {
        input.value = content;
        this.onInputChange(input);
      }
    }
  }

  /** Enter sends, Shift+Enter adds a line break. Ignored while an IME is composing a word. */
  protected onEnter(event: KeyboardEvent, input: HTMLTextAreaElement): void {
    if (event.shiftKey || event.isComposing) return;
    event.preventDefault();
    void this.sendMessage(input.value, input);
  }

  /** Fits the text area to its text, so it grows line by line (CSS max-height then makes it scroll). */
  protected onInputChange(input: HTMLInputElement | HTMLTextAreaElement): void {
    this.messageLength.set(input.value.length);
    this.resizeInput(input);
  }

  private resizeInput(input: HTMLInputElement | HTMLTextAreaElement): void {
    if (!(input instanceof HTMLTextAreaElement)) return;
    // Measuring shrinks the field to one line for a moment: the thread gets taller and the browser
    // pulls its scroll up. Its position is put back below, so typing never moves the thread.
    const thread = this.messagesContainer()?.nativeElement;
    const threadTop = thread?.scrollTop ?? 0;
    // Measured without a scrollbar, which would narrow the text and change where lines wrap.
    input.style.overflowY = 'hidden';
    input.style.height = 'auto';
    // scrollHeight leaves out the borders, which the border-box height includes.
    const borders = input.offsetHeight - input.clientHeight;
    const needed = input.scrollHeight + borders;
    const max = parseFloat(getComputedStyle(input).maxHeight);
    input.style.height = `${Math.min(needed, max)}px`;
    // Scrollbar only once the max height is reached: scrollHeight is rounded to whole pixels, so
    // below that the text can overflow by a fraction of a pixel and show a useless scrollbar.
    input.style.overflowY = needed > max ? 'auto' : 'hidden';
    if (thread) {
      // At the bottom: stay there as the field grows. Otherwise: keep the messages being read.
      thread.scrollTop = this.stickToBottom ? thread.scrollHeight : threadTop;
      // The scroll event that follows must not be taken for the user scrolling up.
      this.lastScrollTop = thread.scrollTop;
    }
  }

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: Event): void {
    // composedPath is fixed at dispatch time, so it stays valid even if the click removed its target
    const path = event.composedPath().filter((el): el is Element => el instanceof Element);
    if (this.showGifPicker() && !path.some(el => el.tagName === 'APP-GIF-PICKER' || el.classList.contains('gif-btn'))) {
      this.showGifPicker.set(false);
    }
    // Closing the full size picture (opened from the card) keeps the card open.
    const keepsProfile = (el: Element) =>
      el.classList.contains('chat-profile-popover') || el.classList.contains('chat-avatar-btn') || el.classList.contains('image-preview');
    if (this.profileUser() && !path.some(keepsProfile)) {
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

  protected onInputAreaFocusIn(): void {
    if (!this.inputFocused()) {
      this.heightBeforeKeyboard = window.visualViewport?.height ?? 0;
      this.keyboardSeen = false;
    }
    this.inputFocused.set(true);
  }

  /** Browser: the keyboard is closed once the screen, after shrinking for it, is back to its full height. */
  private onViewportResize(height: number): void {
    if (!this.inputFocused()) return;
    const shrunk = this.heightBeforeKeyboard - height > KEYBOARD_MIN_HEIGHT;
    if (shrunk) this.keyboardSeen = true;
    else if (this.keyboardSeen) this.blurInput();
  }

  private blurInput(): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement && this.inputArea()?.nativeElement.contains(active)) active.blur();
  }

  protected onInputAreaFocusOut(event: FocusEvent): void {
    // Focus moving inside the area (input -> GIF search) is still typing.
    const area = event.currentTarget as HTMLElement;
    if (!area.contains(event.relatedTarget as Node | null)) this.inputFocused.set(false);
  }

  protected toggleFullscreen(): void {
    this.fullscreen.update(v => !v);
  }

  /** While typing (keyboard open on phones), the focus follows the picker: into its search bar when it
   *  opens, back to the message when it closes. Otherwise nothing gets the focus, so no keyboard pops up. */
  protected toggleGifPicker(): void {
    const opening = !this.showGifPicker();
    const typing = this.inputArea()?.nativeElement.contains(document.activeElement) ?? false;
    const searchFocused = this.gifPicker()?.hasFocus() ?? false;
    this.showGifPicker.set(opening);
    if (opening && typing) {
      afterNextRender(() => this.gifPicker()?.focusSearch(), { injector: this.injector });
    } else if (!opening && searchFocused) {
      this.messageInput()?.nativeElement.focus();
    }
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