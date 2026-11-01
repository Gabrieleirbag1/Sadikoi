import { describe, expect, it } from 'vitest';
import { BubbleCandidate, BubbleEngine } from './vote-bubbles.engine';

const voter = (id: number) => ({ id, name: `v${id}`, picture: null });
const candidate = (id: number, voters: number): BubbleCandidate => ({
  id, name: `c${id}`, picture: null, voters: Array.from({ length: voters }, (_, i) => voter(id * 100 + i)),
});

describe('BubbleEngine', () => {
  it('keeps candidates inside the box and never merges them', () => {
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

  it('bounces the ball itself on the walls, its orbiting voters may slip under the border', () => {
    const engine = new BubbleEngine();
    engine.resize(600, 400);
    engine.sync([candidate(1, 4)]);
    for (let i = 0; i < 60; i++) engine.step(1 / 60); // let the radius grow
    const c = engine.candidates[0];
    c.x = -50;
    c.vx = -10;
    engine.step(1 / 60);
    expect(c.x).toBeCloseTo(c.r, 0);
    expect(c.vx).toBeGreaterThan(0);
    expect(c.x).toBeLessThan(engine.voterOrbitRadius(c));
  });

  it('bounces balls on each other by their own size: orbiting voters slip under the other balls', () => {
    const engine = new BubbleEngine();
    engine.resize(600, 400);
    engine.sync([candidate(1, 3), candidate(2, 3)]);
    for (let i = 0; i < 60; i++) engine.step(1 / 60); // let the radii grow
    const [a, b] = engine.candidates;
    // Rings overlapping, balls apart: no push.
    a.x = 200; a.y = 200; b.x = 200 + a.r + b.r + 4; b.y = 200;
    a.vx = a.vy = b.vx = b.vy = 0;
    engine.options.speedFactor = 0;
    engine.step(1 / 60);
    expect(b.x - a.x).toBeLessThan(engine.voterOrbitRadius(a) + engine.voterOrbitRadius(b));
    expect(b.x - a.x).toBeGreaterThanOrEqual(a.r + b.r);
    // Balls overlapping: pushed apart to touching.
    b.x = a.x + (a.r + b.r) / 2;
    engine.step(1 / 60);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(a.r + b.r, 0);
  });

  it('scales the balls to the box: smaller on a phone, never unreadably small voters', () => {
    const balls = [candidate(1, 2), candidate(2, 1), candidate(3, 1), candidate(4, 0)];
    const desktop = new BubbleEngine();
    desktop.resize(730, 540);
    desktop.sync(balls);
    const phone = new BubbleEngine();
    phone.resize(360, 240);
    phone.sync(balls);

    expect(phone.scale).toBeLessThan(desktop.scale);
    expect(phone.candidates[0].targetR).toBeLessThan(desktop.candidates[0].targetR);
    expect(phone.voterRadius).toBeGreaterThanOrEqual(11);
  });

  it('shrinks the balls when there are more of them, and grows a few in a big box', () => {
    const engine = new BubbleEngine();
    engine.resize(360, 400);
    engine.sync([candidate(1, 0), candidate(2, 0)]);
    const few = engine.scale;
    engine.sync(Array.from({ length: 10 }, (_, i) => candidate(i + 1, 0)));
    expect(engine.scale).toBeLessThan(few);

    const big = new BubbleEngine();
    big.resize(1200, 700);
    big.sync([candidate(1, 1), candidate(2, 0)]);
    expect(big.scale).toBeGreaterThan(1);
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

  it('bounces candidates off obstacles', () => {
    const engine = new BubbleEngine();
    engine.resize(600, 400);
    engine.setObstacles([{ x: 200, y: 150, width: 200, height: 100 }]);
    engine.sync([candidate(1, 0), candidate(2, 0), candidate(3, 0)]);
    for (let i = 0; i < 2000; i++) {
      engine.step(1 / 60);
      for (const c of engine.candidates) {
        const cx = Math.min(Math.max(c.x, 200), 400), cy = Math.min(Math.max(c.y, 150), 250);
        expect(Math.hypot(c.x - cx, c.y - cy)).toBeGreaterThanOrEqual(c.r - 1);
      }
    }
  });
});
