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

  @Input() groupId!: number;

  protected question = signal<Question | null>(null);

  async ngOnInit(): Promise<void> {
    await this.fetchQuestion();
  }

  protected async fetchQuestion(): Promise<void> {
    try {
      const question = await this.questionService.getQuestion(this.groupId);
      this.question.set(question);
      console.log('Fetched question:', this.question());
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  }

}
