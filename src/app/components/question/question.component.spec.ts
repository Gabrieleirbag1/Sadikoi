import type { MockInstance } from 'vitest';
import { Subject } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionComponent } from './question.component';
import { QuestionService } from '../../services/question/question.service';
import { AuthService } from '../../services/auth/auth.service';

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

  describe('tutorial tips', () => {
    const tip = () => (component as any).tipToShow();
    const ask = (votes: unknown[], extra: Partial<Question> = {}) =>
      component.question.set({ id: 1, content: 'Q', canWrite: false, votes, ...extra } as unknown as Question);

    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('user', JSON.stringify({ id: 5 }));
    });

    afterEach(() => localStorage.clear());

    it('explains voting first, then the results once voted, each only once', () => {
      ask([]);
      expect(tip()).toBe('vote');
      (component as any).closeTip('vote');
      expect(tip()).toBeNull();

      ask([{ voterUser: { id: 5 }, targets: [{ id: 6 }] }]);
      expect(tip()).toBe('results');
      (component as any).closeTip('results');
      expect(tip()).toBeNull();
    });

    it('waits for the item announcement to be closed', () => {
      ask([]);
      (component as any).announcementToShow.set({ type: 'new' });
      expect(tip()).toBeNull();
    });

    it('has no tip for written-answer questions', () => {
      ask([], { canWrite: true });
      expect(tip()).toBeNull();
    });
  });

  describe('question feedback', () => {
    const thumbs = () => fixture.nativeElement.querySelectorAll('.question-feedback-side .icon-button') as NodeListOf<HTMLElement>;
    const show = (votes: unknown[], extra: Partial<Question> = {}) => {
      component.question.set({ id: 7, content: 'Q', canWrite: false, votes, ...extra } as unknown as Question);
      fixture.detectChanges();
    };
    const voted = [{ voterUser: { id: 5 }, targets: [{ id: 6 }] }];
    let rateQuestion: MockInstance<QuestionService['rateQuestion']>;

    beforeEach(() => {
      rateQuestion = vi.spyOn(TestBed.inject(QuestionService), 'rateQuestion').mockResolvedValue();
      fixture.componentRef.setInput('group', { id: 1, users: [] } as unknown as Group);
    });

    it('is hidden while voting', () => {
      show([]);
      expect(thumbs().length).toBe(0);
      // the slot is still there, so the question text keeps the same width
      expect(fixture.nativeElement.querySelector('.question-feedback-side')).not.toBeNull();
    });

    it('shows a like and a dislike once the votes are shown', () => {
      show(voted);
      expect([...thumbs()].map(t => t.classList.contains('feedback-like'))).toEqual([true, false]);
    });

    it('is hidden when the question was already rated', () => {
      show(voted, { my_feedback: false });
      expect(thumbs().length).toBe(0);
    });

    it('sends the rating, then fades the thumbs out', async () => {
      show(voted);
      thumbs()[0].click();
      fixture.detectChanges();
      expect(rateQuestion).toHaveBeenCalledWith(1, 7, true);
      const slot = fixture.nativeElement.querySelector('.question-feedback-side') as HTMLElement;
      expect(slot.classList).toContain('rated');
      expect(thumbs()[0].classList).toContain('chosen');
      expect(component.question()?.my_feedback).toBe(true);

      // the chosen thumb's pop bubbles up: the thumbs stay
      thumbs()[0].dispatchEvent(new Event('animationend', { bubbles: true }));
      fixture.detectChanges();
      expect(thumbs().length).toBe(2);

      slot.dispatchEvent(new Event('animationend'));
      fixture.detectChanges();
      expect(thumbs().length).toBe(0);
    });

    it('rates only once', () => {
      show(voted);
      thumbs()[0].click();
      thumbs()[1].click();
      expect(rateQuestion).toHaveBeenCalledTimes(1);
    });

    it('stays hidden when the calendar shows the rated question again (its copy has no my_feedback)', () => {
      show(voted);
      thumbs()[1].click();
      fixture.nativeElement.querySelector('.question-feedback-side').dispatchEvent(new Event('animationend'));
      show(voted);
      expect(thumbs().length).toBe(0);
    });
  });
  describe('item announcement', () => {
    const announcement = { type: 'new' } as unknown as ItemAnnouncement;
    let getQuestion: MockInstance<QuestionService['getQuestion']>;

    beforeEach(() => {
      localStorage.clear();
      getQuestion = vi.spyOn(TestBed.inject(QuestionService), 'getQuestion');
      fixture.componentRef.setInput('group', { id: 1, users: [] } as unknown as Group);
    });

    afterEach(() => localStorage.clear());

    it('shows on the voting screen', async () => {
      getQuestion.mockResolvedValue({ id: 3, content: 'Q', votes: [], announcement } as unknown as Question);
      await component.ngOnInit();
      expect((component as any).announcementToShow()).toEqual(announcement);
    });

    it('does not show once the user has voted (maybe on another device)', async () => {
      const votes = [{ voterUser: { id: 5 }, targets: [{ id: 6 }] }];
      getQuestion.mockResolvedValue({ id: 3, content: 'Q', votes, announcement } as unknown as Question);
      await component.ngOnInit();
      expect((component as any).announcementToShow()).toBeNull();
    });
  });

  describe('language change', () => {
    let getQuestion: MockInstance<QuestionService['getQuestion']>;
    let getQuestionsByDate: MockInstance<QuestionService['getQuestionsByDate']>;
    let languageSaved: Subject<Language>;

    beforeEach(() => {
      const questions = TestBed.inject(QuestionService);
      getQuestion = vi.spyOn(questions, 'getQuestion');
      getQuestionsByDate = vi.spyOn(questions, 'getQuestionsByDate');
      languageSaved = new Subject<Language>();
      (TestBed.inject(AuthService) as any).languageSaved$ = languageSaved;
      fixture.componentRef.setInput('group', { id: 1, users: [] } as unknown as Group);
    });

    it('fetches the question again in the newly saved language', async () => {
      getQuestion.mockResolvedValue({ id: 3, content: 'Who?', votes: [] } as unknown as Question);
      await component.ngOnInit();
      getQuestion.mockResolvedValue({ id: 3, content: 'Qui ?', votes: [] } as unknown as Question);

      languageSaved.next('fr');
      await vi.waitFor(() => expect(component.question()?.content).toBe('Qui ?'));
    });

    it('also translates the past question picked in the calendar', async () => {
      getQuestion.mockResolvedValue({ id: 3, content: 'Who?', votes: [] } as unknown as Question);
      await component.ngOnInit();
      component.question.set({ id: 2, content: 'Old?', date: '2026-03-15T12:00:00', votes: [] } as unknown as Question);
      getQuestion.mockResolvedValue({ id: 3, content: 'Qui ?', votes: [] } as unknown as Question);
      getQuestionsByDate.mockResolvedValue([{ id: 2, content: 'Ancienne ?', votes: [] } as unknown as Question]);

      languageSaved.next('fr');
      await vi.waitFor(() => expect(component.question()?.content).toBe('Ancienne ?'));
      expect(getQuestionsByDate).toHaveBeenCalledWith(1, 3, 2026);
    });
  });
});
