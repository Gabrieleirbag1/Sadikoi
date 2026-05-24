import { Component, inject, Input, signal } from '@angular/core';
import { ChatService } from '../../services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  private readonly logger = inject(LoggerService);
  private readonly chatService = inject(ChatService);
  protected messages = signal<Message[]>([]);

  @Input() groupId!: number;

  async ngOnInit(): Promise<void> {
    this.loadMessages(this.groupId);
  }

  protected async loadMessages(groupId: number): Promise<void> {
    try {
      const response = await this.chatService.getMessages(groupId);
      this.messages.set(response);
      this.logger.debug('Loaded messages:', this.messages());
    } catch (error) {
      this.logger.error('Error loading messages:', error);
    }
  }

  protected async sendMessage(content: string): Promise<void> {
    try {
      const newMessage = await this.chatService.sendMessage(this.groupId, content);
      if (newMessage) this.messages.update(messages => [...messages, newMessage]);
      this.logger.debug('Sent message:', newMessage);
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }
}
