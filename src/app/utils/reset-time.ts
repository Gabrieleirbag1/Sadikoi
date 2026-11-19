const DAY = 24 * 60 * 60 * 1000;
/** Shortest time a question stays (MIN_QUESTION_INTERVAL in the API). */
const MIN_QUESTION_INTERVAL = DAY;

/**
 * When the API will create the question after the one dated `questionDate`, if the group's reset time
 * becomes `resetUtc` ("HH:MM", UTC). Same rule as next_question_time (API, builder.py): the question
 * stays until the first reset after its window, and at least 24 h, plus the time the reset moved later
 * that day. So a new time only applies once the current question has had its 24 h.
 */
export function nextQuestionAt(questionDate: string, resetUtc: string): Date | null {
  const date = Date.parse(questionDate);
  const time = /^(\d{1,2}):(\d{2})/.exec(resetUtc);
  if (Number.isNaN(date) || !time) return null;
  const hours = Number(time[1]), minutes = Number(time[2]);
  const day = new Date(date);
  // The new reset time on the question's day (UTC), and the window the question would be in.
  const reset = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes);
  const windowStart = date >= reset ? reset : reset - DAY;
  const required = MIN_QUESTION_INTERVAL + Math.max(0, reset - date);
  return new Date(Math.max(windowStart + DAY, date + required));
}
