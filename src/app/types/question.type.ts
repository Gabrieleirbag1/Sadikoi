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
  item: string,
  votes?: Vote[],
}