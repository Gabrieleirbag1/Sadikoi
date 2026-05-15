import { Component, inject, Input, signal } from '@angular/core';
import { ChatService } from '../../services/chat/chat.service';
import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {

  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  protected messages = signal<Message[]>([]);

  @Input() groupId!: number;

  async ngOnInit(): Promise<void> {
    const response = await this.authService.getLocalUser();
    if (response) {
      this.loadMessages(this.groupId);
    } else {
      console.error('User not authenticated');
    }
  }

  protected async loadMessages(groupId: number): Promise<void> {
    try {
      const response = await this.chatService.getMessages(groupId);
      this.messages.set(response);
      console.log('Loaded messages:', this.messages());
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  protected async sendMessage(content: string): Promise<void> {
    try {
      const newMessage = await this.chatService.sendMessage(this.groupId, content);
      if (newMessage) this.messages.update(messages => [...messages, newMessage]);
      console.log('Sent message:', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
