import { nextQuestionAt } from './reset-time';

// Same cases as test_next_question_waits_24_hours_after_a_reset_time_change (API).
describe('nextQuestionAt', () => {
  const question = '2026-01-01T15:00:00+00:00';

  it('is the next reset when the time does not change', () => {
    expect(nextQuestionAt(question, '15:00')?.toISOString()).toBe('2026-01-02T15:00:00.000Z');
  });

  it('keeps the question 24 h when the reset moves earlier', () => {
    expect(nextQuestionAt(question, '10:00')?.toISOString()).toBe('2026-01-02T15:00:00.000Z');
  });

  it('waits for the new time of the next day when the reset moves later', () => {
    expect(nextQuestionAt(question, '20:00')?.toISOString()).toBe('2026-01-02T20:00:00.000Z');
  });

  it('is null for an invalid date or time', () => {
    expect(nextQuestionAt('', '10:00')).toBeNull();
    expect(nextQuestionAt(question, '')).toBeNull();
  });
});
