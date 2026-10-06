import { describe, expect, it } from 'vitest';
import { BubbleCandidate, BubbleEngine } from './vote-bubbles.engine';

const voter = (id: number) => ({ id, name: `v${id}`, picture: null });
const candidate = (id: number, voters: number): BubbleCandidate => ({
  id, name: `c${id}`, picture: null, voters: Array.from({ length: voters }, (_, i) => voter(id * 100 + i)),
});

describe('BubbleEngine', () => {
  it('keeps candidates (and their orbit) inside the box and never merges them', () => {
    const engine = new BubbleEngine();
    engine.resize(600, 400);
    engine.sync([candidate(1, 3), candidate(2, 0), candidate(3, 5)]);
    for (let i = 0; i < 2000; i++) {
      engine.step(1 / 60);
      for (const c of engine.candidates) {
        expect(c.x - c.r).toBeGreaterThanOrEqual(-0.5);
        expect(c.y - c.r).toBeGreaterThanOrEqual(-0.5);
        expect(c.x + c.r).toBeLessThanOrEqual(600.5);
        expect(c.y + c.r).toBeLessThanOrEqual(400.5);
      }
    }
    expect(engine.candidates.length).toBe(3);
  });

  it('grows with votes', () => {
    const engine = new BubbleEngine();
    engine.resize(800, 600);
    engine.sync([candidate(1, 0), candidate(2, 6)]);
    expect(engine.candidates[1].targetR).toBeGreaterThan(engine.candidates[0].targetR);
  });

  it('keeps position on resync and removes missing candidates', () => {
    const engine = new BubbleEngine();
    engine.resize(600, 400);
    engine.sync([candidate(1, 0), candidate(2, 0)]);
    const { x, y } = engine.candidates[0];
    engine.sync([candidate(1, 1)]);
    expect(engine.candidates.length).toBe(1);
    expect(engine.candidates[0].x).toBeCloseTo(x, 0);
    expect(engine.candidates[0].y).toBeCloseTo(y, 0);
  });

  it('hit-tests candidates', () => {
    const engine = new BubbleEngine();
    engine.resize(600, 400);
    engine.sync([candidate(1, 0)]);
    const c = engine.candidates[0];
    expect(engine.hitTest(c.x, c.y)?.id).toBe(1);
    expect(engine.hitTest(-100, -100)).toBeNull();
  });
});
