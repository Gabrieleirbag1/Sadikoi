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
}

export interface CandidateState {
  id: number;
  name: string;
  picture: string | null;
  voters: BubbleVoter[];
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

export interface EngineOptions {
  minRadius: number;
  maxRadius: number;
  voterRadius: number;
  maxSpeed: number;
  /** Multiplicateur de vitesse (0 = figé). */
  speedFactor: number;
}

/** Free space between a candidate and its orbiting voters. */
const ORBIT_GAP = 8;

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

  public constructor(options: Partial<EngineOptions> = {}, private readonly random: () => number = Math.random) {
    this.options = { ...DEFAULTS, ...options };
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.candidates.forEach(c => {
      c.targetR = this.radiusFor(c);
      this.clamp(c);
    });
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
          id: d.id, name: d.name, picture: d.picture, voters: d.voters,
          x: this.width * (0.2 + this.random() * 0.6),
          y: this.height * (0.2 + this.random() * 0.6),
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          r: this.options.minRadius, targetR: this.options.minRadius,
          orbitAngle: this.random() * Math.PI * 2,
        };
        this.candidates.push(state);
      }
      state.name = d.name;
      state.picture = d.picture;
      state.voters = d.voters;
      state.targetR = this.radiusFor(state);
      this.clamp(state);
    }
  }

  /** Immobilise un candidat (ex. sélectionné) pour faciliter le clic. */
  public freeze(id: number | null): void {
    this.frozenId = id;
  }

  public step(dt: number): void {
    dt = Math.min(dt, 0.05);
    const { maxSpeed, speedFactor } = this.options;
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
    this.candidates.forEach(c => this.clamp(c));
  }

  /** Rayon orbital d'un votant autour de son candidat. */
  public voterOrbitRadius(c: CandidateState): number {
    return c.r + this.options.voterRadius + ORBIT_GAP;
  }

  public voterPositions(): VoterPosition[] {
    const out: VoterPosition[] = [];
    for (const c of this.candidates) {
      const n = c.voters.length;
      const orbit = this.voterOrbitRadius(c);
      c.voters.forEach((voter, i) => {
        const a = c.orbitAngle + (i / n) * Math.PI * 2;
        out.push({ voter, owner: c, r: this.options.voterRadius, x: c.x + Math.cos(a) * orbit, y: c.y + Math.sin(a) * orbit });
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

  /** Aire proportionnelle au nombre de voix, bornée par la taille de la box. */
  private radiusFor(c: CandidateState): number {
    const { minRadius, maxRadius } = this.options;
    const votes = c.voters.length;
    const cap = Math.max(minRadius, Math.min(maxRadius, Math.min(this.width, this.height) / 4 || maxRadius));
    return Math.max(minRadius * 0.6, Math.min(cap, minRadius + Math.sqrt(votes) * (maxRadius - minRadius) * 0.45));
  }

  private bounce(c: CandidateState): void {
    const m = c.r;
    if (c.x < m) { c.x = m; c.vx = Math.abs(c.vx); }
    else if (c.x > this.width - m) { c.x = this.width - m; c.vx = -Math.abs(c.vx); }
    if (c.y < m) { c.y = m; c.vy = Math.abs(c.vy); }
    else if (c.y > this.height - m) { c.y = this.height - m; c.vy = -Math.abs(c.vy); }
  }

  private clamp(c: CandidateState): void {
    const m = Math.min(c.r, this.width / 2, this.height / 2);
    c.x = Math.min(Math.max(c.x, m), Math.max(m, this.width - m));
    c.y = Math.min(Math.max(c.y, m), Math.max(m, this.height - m));
  }

  /** Les boules se repoussent doucement : jamais d'absorption ni de fusion. */
  private collide(): void {
    const list = this.candidates;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const min = a.r + b.r;
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
