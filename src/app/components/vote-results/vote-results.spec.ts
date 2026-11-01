import { describe, expect, it } from 'vitest';
import { buildVoteResults } from './vote-results';

const user = (id: number): User => ({ id, username: `u${id}`, email: '', date_created: '', language: 'fr' });
const vote = (voter: number, ...targets: number[]): Vote => ({ voterUser: user(voter), targets: targets.map(user) });
const summary = (rows: ReturnType<typeof buildVoteResults>) =>
  rows.map(r => ({ targets: r.targets.map(t => t.id), voters: r.voters.map(v => v.id), percent: r.percent }));

describe('buildVoteResults', () => {
  it('solo: one row per voted member, most voted first, without duplicate voters', () => {
    const rows = buildVoteResults([vote(1, 2), vote(2, 3), vote(3, 2), vote(3, 2), vote(4, 2)], false);
    expect(summary(rows)).toEqual([
      { targets: [2], voters: [1, 3, 4], percent: 75 },
      { targets: [3], voters: [2], percent: 25 },
    ]);
  });

  it('ranking: a voter counts in every row they picked, so percents can sum over 100', () => {
    const rows = buildVoteResults([vote(1, 2, 3), vote(2, 3)], false);
    expect(summary(rows)).toEqual([
      { targets: [3], voters: [1, 2], percent: 100 },
      { targets: [2], voters: [1], percent: 50 },
    ]);
  });

  it('duo: one row per pair, whatever the order the two members were picked in', () => {
    const rows = buildVoteResults([vote(1, 2, 3), vote(2, 3, 2), vote(3, 1, 2), vote(4, 2, 3)], true);
    expect(summary(rows)).toEqual([
      { targets: [2, 3], voters: [1, 2, 4], percent: 75 },
      { targets: [1, 2], voters: [3], percent: 25 },
    ]);
  });
});
