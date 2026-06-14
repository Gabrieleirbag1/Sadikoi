import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { QuestionService } from '../../services/question/question.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { ChatComponent } from "../chat/chat.component";

@Component({
  selector: 'app-question',
  imports: [CommonModule, ChatComponent],
  templateUrl: './question.component.html',
  styleUrl: './question.component.css',
})
export class QuestionComponent implements OnInit{
  private readonly logger = inject(LoggerService)
  private readonly questionService = inject(QuestionService);
  protected connectedUser: User | null = null;
  protected usersId: number[] = [];
  protected question = signal<Question | null>(null);

  @Input() group: Group | null = null;

  async ngOnInit(): Promise<void> {
    this.connectedUser = JSON.parse(localStorage.getItem('user') || '{}');
    await this.fetchQuestion();
  }

  protected async fetchQuestion(): Promise<void> {
    try {
      if (!this.group) throw new Error('Group is not set');
      const question = await this.questionService.getQuestion(this.group.id);
      this.question.set(question);
      this.logger.debug('Fetched question:', this.question());
    } catch (error) {
      this.logger.error('Error fetching question:', error);
    }
  }

  protected async submitVote(votedUsersId: number[], writtenAnswer?: string): Promise<void> {
    try {
      if (!this.question()) throw new Error('No question available to vote on');
      const response = await this.questionService.submitVote(this.question()!.id, votedUsersId, writtenAnswer);
      this.logger.debug('Vote submitted successfully', response);
      if (response) this.question.update(q => q ? { ...q, votes: response } : q);
    } catch (error) {
      this.logger.error('Error submitting vote:', error);
    }
  }

  protected toggleVote(userId: number): void {
    if (this.usersId.includes(userId)) {
      this.usersId = this.usersId.filter(id => id !== userId);
    } else {
      this.usersId.push(userId);
    }
  }

}
