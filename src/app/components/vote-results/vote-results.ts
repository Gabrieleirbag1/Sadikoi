/** One line of the detailed results: who was voted for (one member, or two for a duo) and by whom. */
export interface VoteResultRow {
  targets: User[];
  voters: User[];
  /** Share of all the voters who picked this row (0-100). Ranking questions can sum to more than 100. */
  percent: number;
}

/**
 * Groups the votes by voted member, or by voted pair for a duo question (A+B and B+A are the same pair),
 * most voted first.
 */
export function buildVoteResults(votes: Vote[], duo: boolean): VoteResultRow[] {
  const rows = new Map<string, { targets: User[]; voters: Map<number, User> }>();
  const allVoters = new Set<number>();

  const add = (targets: User[], voter: User) => {
    const key = targets.map(t => t.id).sort((a, b) => a - b).join('-');
    let row = rows.get(key);
    if (!row) {
      row = { targets: [...targets].sort((a, b) => a.id - b.id), voters: new Map() };
      rows.set(key, row);
    }
    row.voters.set(voter.id, voter);
  };

  for (const vote of votes) {
    if (!vote.targets.length) continue;
    allVoters.add(vote.voterUser.id);
    if (duo) add(vote.targets, vote.voterUser);
    else vote.targets.forEach(target => add([target], vote.voterUser));
  }

  const total = allVoters.size;
  const name = (row: { targets: User[] }) => row.targets.map(t => t.username).join(' & ');
  return [...rows.values()]
    .map(row => ({
      targets: row.targets,
      voters: [...row.voters.values()],
      percent: total ? Math.round((row.voters.size / total) * 100) : 0,
    }))
    .sort((a, b) => b.voters.length - a.voters.length || name(a).localeCompare(name(b)));
}

/** DUO questions: every vote picks exactly two members (same rule as the API). */
export function isDuoQuestion(question: Question | null | undefined): boolean {
  return !!question?.enableMultipleVoting && question.voteNumberLimit === 2;
}
