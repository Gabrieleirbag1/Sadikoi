interface Question {
  id: number,
  question_id: number,
  content: string,
  theme: string,
  enableSelfVote: boolean,
  enableMultipleVoting: boolean,
  voteNumberLimit: number,
  canWrite: boolean,
  item: string,
  hasVoted?: boolean
}