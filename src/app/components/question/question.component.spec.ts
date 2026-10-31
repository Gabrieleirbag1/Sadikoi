import type { MockInstance } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionComponent } from './question.component';
import { QuestionService } from '../../services/question/question.service';

describe('QuestionComponent', () => {
  let component: QuestionComponent;
  let fixture: ComponentFixture<QuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('next question countdown', () => {
    const question = (id: number, nextAt: string) =>
      ({ id, content: `Q${id}`, votes: [], next_question_at: nextAt } as unknown as Question);
    let getQuestion: MockInstance<QuestionService['getQuestion']>;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
      getQuestion = vi.spyOn(TestBed.inject(QuestionService), 'getQuestion');
      fixture.componentRef.setInput('group', { id: 1, users: [], daily_reset_timestamp: '15:00' } as unknown as Group);
    });

    afterEach(() => vi.useRealTimers());

    const timerText = () => fixture.nativeElement.querySelector('.next-question-time')?.textContent?.trim();

    it('counts down to the next question', async () => {
      getQuestion.mockResolvedValue(question(1, '2026-01-01T15:00:00+00:00'));
      await component.ngOnInit();
      fixture.detectChanges();
      expect(timerText()).toBe('03:00:00');

      vi.advanceTimersByTime(61_000);
      fixture.detectChanges();
      expect(timerText()).toBe('02:58:59');
    });

    it('loads the new question when the countdown ends, without reloading the page', async () => {
      getQuestion.mockResolvedValue(question(1, '2026-01-01T12:00:02+00:00'));
      await component.ngOnInit();
      getQuestion.mockResolvedValue(question(2, '2026-01-02T12:00:00+00:00'));

      vi.advanceTimersByTime(2_000);
      await vi.waitFor(() => expect(component.question()?.id).toBe(2));
      expect(getQuestion).toHaveBeenCalledTimes(2);
    });

    it('does not ask every second while the server still has the old question', async () => {
      getQuestion.mockResolvedValue(question(1, '2026-01-01T12:00:01+00:00'));
      await component.ngOnInit();
      vi.advanceTimersByTime(5_000);
      expect(getQuestion).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(10_000);
      expect(getQuestion).toHaveBeenCalledTimes(3);
    });
  });
});
