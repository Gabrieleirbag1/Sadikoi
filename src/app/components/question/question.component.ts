import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { QuestionService } from '../../services/question/question.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-question',
  imports: [CommonModule],
  templateUrl: './question.component.html',
  styleUrl: './question.component.css',
})
export class QuestionComponent implements OnInit{

  private readonly questionService = inject(QuestionService);

  protected usersId: number[] = [];

  @Input() group: Group | null = null;

  protected question = signal<Question | null>(null);

  async ngOnInit(): Promise<void> {
    await this.fetchQuestion();
  }

  protected async fetchQuestion(): Promise<void> {
    try {
      if (!this.group) throw new Error('Group is not set');
      const question = await this.questionService.getQuestion(this.group.id);
      this.question.set(question);
      console.log('Fetched question:', this.question());
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  }

  protected async submitVote(votedUsersId: number[]): Promise<void> {
    try {
      if (!this.question()) throw new Error('No question available to vote on');
      await this.questionService.submitVote(this.question()!.id, votedUsersId);
      console.log('Vote submitted successfully');
    } catch (error) {
      console.error('Error submitting vote:', error);
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
