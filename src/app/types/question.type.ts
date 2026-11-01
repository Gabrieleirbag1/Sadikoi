interface Question {
  id: number,
  question_id: number,
  content: string,
  theme: string,
  enableSelfVote: boolean,
  enableMultipleVoting: boolean,
  voteNumberLimit: number,
  canWrite: boolean,
  date?: string,
  item_name: string,
  votes?: Vote[],
  announcement?: ItemAnnouncement | null,
  /** Current question only (ISO, UTC): when the next question of the day comes out. */
  next_question_at?: string,
  /** The connected user's opinion of this question: liked (true), disliked (false), not rated yet (null). */
  my_feedback?: boolean | null,
}