export interface BubbleVoter {
  id: number;
  name: string;
  picture: string | null;
}

export interface BubbleCandidate {
  id: number;
  name: string;
  picture: string | null;
  voters: BubbleVoter[];
  /** Written answer shown in a speech bubble next to the ball (answer-input questions). */
  answer?: string;
}

export interface CandidateState {
  id: number;
  name: string;
  picture: string | null;
  voters: BubbleVoter[];
  answer?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  targetR: number;
  /** Phase de départ de l'orbite des votants. */
  orbitAngle: number;
}

export interface VoterPosition {
  voter: BubbleVoter;
  x: number;
  y: number;
  r: number;
  owner: CandidateState;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Sizes for a ball "at scale 1": the engine scales them to the box (see `scale`). */
export interface EngineOptions {
  minRadius: number;
  maxRadius: number;
  voterRadius: number;
  /** Pixels per second at scale 1. */
  maxSpeed: number;
  /** Multiplicateur de vitesse (0 = figé). */
  speedFactor: number;
}

/** Free space between a candidate and its orbiting voters (at scale 1). */
const ORBIT_GAP = 8;
/** Share of the free area that the balls, with their ring of voters, should cover. */
const FILL = 0.5;
const MIN_SCALE = 0.45;
const MAX_SCALE = 1.3;
/** Smaller, a voter's picture can't be recognized. */
const MIN_VOTER_RADIUS = 11;

const DEFAULTS: EngineOptions = {
  minRadius: 38,
  maxRadius: 90,
  voterRadius: 16,
  maxSpeed: 70,
  speedFactor: 1,
};

/**
 * Moteur de simulation pur (sans DOM) : déplacement aléatoire borné, collisions sans
 * absorption, orbite des votants. Les coordonnées sont en pixels CSS.
 */
export class BubbleEngine {
  public width = 0;
  public height = 0;
  public readonly candidates: CandidateState[] = [];
  public readonly options: EngineOptions;
  /** Orbite : un tour complet en ~8 s. */
  private orbitSpeed = (Math.PI * 2) / 8;
  private frozenId: number | null = null;
  /** Solid rectangles (e.g. the answer card) that candidates bounce on. */
  private obstacles: Rect[] = [];
  /**
   * Size of everything relative to the options: computed from the box area and the balls to show,
   * so a phone gets smaller balls that don't pile up, and a few balls in a big box get bigger ones.
   */
  public scale = 1;

  public constructor(options: Partial<EngineOptions> = {}, private readonly random: () => number = Math.random) {
    this.options = { ...DEFAULTS, ...options };
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.updateScale();
  }

  public get voterRadius(): number {
    return Math.max(MIN_VOTER_RADIUS, this.options.voterRadius * this.scale);
  }

  private get orbitGap(): number {
    return ORBIT_GAP * this.scale;
  }

  /** Room a candidate takes: the ball, plus the ring of its voters. Collisions and walls use it. */
  public footprint(c: CandidateState): number {
    return c.voters.length ? c.r + 2 * this.voterRadius + this.orbitGap : c.r;
  }

  /** Synchronise les candidats en conservant la position de ceux déjà présents. */
  public sync(data: BubbleCandidate[]): void {
    const incoming = new Set(data.map(d => d.id));
    for (let i = this.candidates.length - 1; i >= 0; i--) {
      if (!incoming.has(this.candidates[i].id)) this.candidates.splice(i, 1);
    }
    for (const d of data) {
      let state = this.candidates.find(c => c.id === d.id);
      if (!state) {
        const angle = this.random() * Math.PI * 2;
        const speed = this.options.maxSpeed * (0.3 + this.random() * 0.5);
        state = {
          id: d.id, name: d.name, picture: d.picture, voters: d.voters, answer: d.answer,
          x: this.width * (0.2 + this.random() * 0.6),
          y: this.height * (0.2 + this.random() * 0.6),
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          r: this.options.minRadius * this.scale, targetR: this.options.minRadius * this.scale,
          orbitAngle: this.random() * Math.PI * 2,
        };
        this.candidates.push(state);
      }
      state.name = d.name;
      state.picture = d.picture;
      state.voters = d.voters;
      state.answer = d.answer;
    }
    this.updateScale();
  }

  public setObstacles(obstacles: Rect[]): void {
    this.obstacles = obstacles;
    this.updateScale();
  }

  /** Picks `scale` so the balls cover about FILL of the free area, and the biggest one still has room to move. */
  private updateScale(): void {
    const { width: w, height: h } = this;
    if (w && h && this.candidates.length) {
      const obstacles = this.obstacles.reduce((sum, o) => sum + o.width * o.height, 0);
      const free = Math.max(w * h * 0.3, w * h - obstacles);
      const sizes = this.candidates.map(c =>
        this.baseRadius(c) + (c.voters.length ? 2 * this.options.voterRadius + ORBIT_GAP : 0));
      const area = sizes.reduce((sum, r) => sum + Math.PI * r * r, 0);
      const fit = Math.min(Math.sqrt((FILL * free) / area), Math.min(w, h) / (2.2 * Math.max(...sizes)));
      this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit));
    }
    this.candidates.forEach(c => {
      c.targetR = this.baseRadius(c) * this.scale;
      this.clamp(c);
    });
  }

  /** Immobilise un candidat (ex. sélectionné) pour faciliter le clic. */
  public freeze(id: number | null): void {
    this.frozenId = id;
  }

  public step(dt: number): void {
    dt = Math.min(dt, 0.05);
    const { speedFactor } = this.options;
    // Smaller balls move slower, so they look the same speed on a phone.
    const maxSpeed = this.options.maxSpeed * this.scale;
    const k = dt * speedFactor;

    for (const c of this.candidates) {
      c.r += (c.targetR - c.r) * Math.min(1, dt * 6);
      c.orbitAngle += this.orbitSpeed * k;
      if (c.id === this.frozenId) continue;

      // Dérive aléatoire de la direction.
      c.vx += (this.random() - 0.5) * maxSpeed * 2 * dt;
      c.vy += (this.random() - 0.5) * maxSpeed * 2 * dt;
      const speed = Math.hypot(c.vx, c.vy);
      if (speed > maxSpeed) {
        c.vx = (c.vx / speed) * maxSpeed;
        c.vy = (c.vy / speed) * maxSpeed;
      } else if (speed < maxSpeed * 0.25) {
        const a = this.random() * Math.PI * 2;
        c.vx += Math.cos(a) * maxSpeed * 0.2;
        c.vy += Math.sin(a) * maxSpeed * 0.2;
      }
      c.x += c.vx * k;
      c.y += c.vy * k;
      this.bounce(c);
    }
    this.collide();
    this.candidates.forEach(c => {
      this.collideObstacles(c);
      this.clamp(c);
    });
  }

  /** Circle vs rectangle: push the ball out and reflect its velocity. */
  private collideObstacles(c: CandidateState): void {
    for (const o of this.obstacles) {
      const cx = Math.min(Math.max(c.x, o.x), o.x + o.width);
      const cy = Math.min(Math.max(c.y, o.y), o.y + o.height);
      let dx = c.x - cx, dy = c.y - cy;
      const r = this.footprint(c);
      let dist = Math.hypot(dx, dy);
      if (dist >= r) continue;
      let nx: number, ny: number, push: number;
      if (dist > 0) {
        nx = dx / dist; ny = dy / dist; push = r - dist;
      } else {
        // centre inside the rectangle: leave through the nearest side
        const left = c.x - o.x, right = o.x + o.width - c.x, top = c.y - o.y, bottom = o.y + o.height - c.y;
        const min = Math.min(left, right, top, bottom);
        nx = min === left ? -1 : min === right ? 1 : 0;
        ny = min === top ? -1 : min === bottom ? 1 : 0;
        if (nx !== 0) ny = 0;
        push = min + r;
      }
      c.x += nx * push;
      c.y += ny * push;
      const dot = c.vx * nx + c.vy * ny;
      if (dot < 0) {
        c.vx -= 2 * dot * nx;
        c.vy -= 2 * dot * ny;
      }
    }
  }

  /** Rayon orbital d'un votant autour de son candidat. */
  public voterOrbitRadius(c: CandidateState): number {
    return c.r + this.voterRadius + this.orbitGap;
  }

  public voterPositions(): VoterPosition[] {
    const out: VoterPosition[] = [];
    for (const c of this.candidates) {
      const n = c.voters.length;
      const orbit = this.voterOrbitRadius(c);
      c.voters.forEach((voter, i) => {
        const a = c.orbitAngle + (i / n) * Math.PI * 2;
        out.push({ voter, owner: c, r: this.voterRadius, x: c.x + Math.cos(a) * orbit, y: c.y + Math.sin(a) * orbit });
      });
    }
    return out;
  }

  /** Candidat sous le point, le plus récemment dessiné (donc au-dessus) d'abord. */
  public hitTest(px: number, py: number): CandidateState | null {
    for (let i = this.candidates.length - 1; i >= 0; i--) {
      const c = this.candidates[i];
      if (Math.hypot(px - c.x, py - c.y) <= c.r) return c;
    }
    return null;
  }

  /** Radius at scale 1: grows with the votes, up to maxRadius. */
  private baseRadius(c: CandidateState): number {
    const { minRadius, maxRadius } = this.options;
    return Math.min(maxRadius, minRadius + Math.sqrt(c.voters.length) * (maxRadius - minRadius) * 0.45);
  }

  private bounce(c: CandidateState): void {
    // Capped at half the box, like clamp(): a ring wider than the box mustn't flip direction every frame.
    const mx = Math.min(this.footprint(c), this.width / 2), my = Math.min(this.footprint(c), this.height / 2);
    if (c.x < mx) { c.x = mx; c.vx = Math.abs(c.vx); }
    else if (c.x > this.width - mx) { c.x = this.width - mx; c.vx = -Math.abs(c.vx); }
    if (c.y < my) { c.y = my; c.vy = Math.abs(c.vy); }
    else if (c.y > this.height - my) { c.y = this.height - my; c.vy = -Math.abs(c.vy); }
  }

  private clamp(c: CandidateState): void {
    const mx = Math.min(this.footprint(c), this.width / 2), my = Math.min(this.footprint(c), this.height / 2);
    c.x = Math.min(Math.max(c.x, mx), this.width - mx);
    c.y = Math.min(Math.max(c.y, my), this.height - my);
  }

  /** Les boules se repoussent doucement : jamais d'absorption ni de fusion. */
  private collide(): void {
    const list = this.candidates;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const min = this.footprint(a) + this.footprint(b);
        if (dist >= min) continue;
        const nx = dx / dist, ny = dy / dist;
        const push = (min - dist) / 2;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        // échange de la composante normale des vitesses (rebond élastique)
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          a.vx += rel * nx; a.vy += rel * ny;
          b.vx -= rel * nx; b.vy -= rel * ny;
        }
      }
    }
  }
}
