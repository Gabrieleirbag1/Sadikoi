import { Component, inject, Input, signal } from '@angular/core';
import { ChatService } from '../../services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { GifPickerComponent } from '../gif-picker/gif-picker.component';
import { KlipyGif, KlipyService } from '../../services/klipy/klipy.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, GifPickerComponent, TranslatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  private readonly logger = inject(LoggerService);
  private readonly chatService = inject(ChatService);
  private readonly klipyService = inject(KlipyService);

  protected messages = signal<Message[]>([]);
  protected showGifPicker = signal(false);

  @Input() group: Group | null = null;

  async ngOnInit(): Promise<void> {
    if (this.group) this.loadMessages(this.group.id);
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
      if (!this.group) throw new Error('Group is not set');
      const newMessage = await this.chatService.sendMessage(this.group.id, content);
      if (newMessage) this.messages.update(messages => [...messages, newMessage]);
      if (input) input.value = '';
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
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

  protected isGifMessage(content: string): boolean {
    return content.startsWith('https://') && content.includes('klipy');
  }
}