import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input,
  model, NgZone, output, signal, viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UserProfileService } from '../../services/user-profile/user-profile.service';
import { UserProfileComponent } from '../tooltips/user-profile/user-profile.component';
import { environment } from '../../../environments/environment';
import { BubbleCandidate, BubbleEngine, BubbleVoter, CandidateState } from './vote-bubbles.engine';

export interface VoteBubbleData {
  votedUser: User;
  voters: User[];
  /** Written answer: rendered as a speech bubble next to the ball instead of orbiting voters. */
  answer?: string;
}

/** Approximate tooltip footprint, only used to decide when to flip it away from an edge. */
const TOOLTIP_WIDTH = 280;
const TOOLTIP_HEIGHT = 180;
const DEFAULT_PICTURE = '/default-profile.svg';
/** Angle (rad) de la ligne de séparation : la photo occupe le haut-gauche, le pseudo le bas-droite. */
const SPLIT_ANGLE = -Math.PI / 6;
/** Agar.io-like decor colours (food pellets). Purely cosmetic: nothing eats them. */
const PELLET_COLORS = ['#ff4d6d', '#ffd23f', '#3ddc97', '#4cc9f0', '#b583ff', '#ff9f1c', '#7bed4f', '#f15bb5'];
const PELLET_COUNT = 110;
const VIRUS_COUNT = 2;
const VIRUS_SPIKES = 22;
const PALETTE = ['#e76f51', '#2a9d8f', '#e9c46a', '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ff924c'];

@Component({
  selector: 'app-vote-bubbles',
  imports: [TranslatePipe, UserProfileComponent],
  templateUrl: './vote-bubbles.component.html',
  styleUrls: ['./vote-bubbles.component.css', '../tooltips/user-profile/user-profile-tooltip.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteBubblesComponent {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly userProfileService = inject(UserProfileService);
  protected readonly tooltipScope = 'vote-bubbles';

  public readonly bubbles = input.required<VoteBubbleData[]>();
  public readonly group = input<Group | null>(null);
  public readonly phase = input<'voting' | 'results'>('results');
  public readonly disabled = input(false);
  public readonly multiple = input(false);
  public readonly selectedIds = model<number[]>([]);
  public readonly voted = output<number[]>();

  protected readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly boxRef = viewChild.required<ElementRef<HTMLElement>>('box');
  /** Wrapper of the projected content (e.g. the answer card): bubbles bounce on it. */
  protected readonly obstacleRef = viewChild.required<ElementRef<HTMLElement>>('obstacle');

  protected readonly hoveredId = signal<number | null>(null);
  protected readonly isVoting = computed(() => this.phase() === 'voting' && !this.disabled());
  protected readonly candidates = computed<BubbleCandidate[]>(() =>
    this.bubbles().map(b => ({
      id: b.votedUser.id,
      name: b.votedUser.username,
      picture: this.pictureUrl(b.votedUser),
      answer: b.answer,
      voters: b.voters.map<BubbleVoter>(v => ({ id: v.id, name: v.username, picture: this.pictureUrl(v) })),
    })),
  );
  /** User shown in the tooltip: outlives the canvas hover so the pointer can travel onto the tooltip. */
  private readonly tooltipUserId = signal<number | null>(null);
  protected readonly tooltipUser = computed(() => this.bubbles().find(b => b.votedUser.id === this.tooltipUserId())?.votedUser ?? null);
  protected readonly tooltipPos = signal({ x: 0, y: 0, flipX: false, flipY: false });

  private readonly engine = new BubbleEngine();
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly speech = new Map<number, { key: string; lines: string[]; width: number; side: 'left' | 'right' }>();
  private ctx: CanvasRenderingContext2D | null = null;
  private frame = 0;
  private lastTime = 0;
  /** Decor positions are normalised (0..1) so they follow the box when it is resized. */
  private readonly pellets = Array.from({ length: PELLET_COUNT }, () => ({
    x: Math.random(), y: Math.random(), r: 3 + Math.random() * 3.5,
    color: PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)], phase: Math.random() * Math.PI * 2,
  }));
  private readonly viruses = Array.from({ length: VIRUS_COUNT }, (_, i) => ({
    x: 0.12 + Math.random() * 0.76, y: 0.15 + (i + Math.random() * 0.7) * (0.7 / VIRUS_COUNT), phase: Math.random() * Math.PI * 2,
  }));
  private ready = false;
  private hideTimeout: any;

  public constructor() {
    afterNextRender(() => {
      this.ctx = this.canvasRef().nativeElement.getContext('2d');
      this.setupResize();
      this.ready = true;
      this.engine.sync(this.candidates());
      this.zone.runOutsideAngular(() => (this.frame = requestAnimationFrame(t => this.loop(t))));
    });

    effect(() => {
      const data = this.candidates();
      for (const id of this.speech.keys()) {
        if (!data.some(c => c.id === id)) this.speech.delete(id);
      }
      if (this.ready) this.engine.sync(data);
    });

    effect(() => {
      const ids = this.selectedIds();
      this.engine.freeze(this.isVoting() && ids.length ? ids[ids.length - 1] : null);
    });

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.frame);
      clearTimeout(this.hideTimeout);
    });
  }

  /** Input of the last press: 'touch' on phones, 'mouse' on laptops (the click event alone doesn't say it everywhere). */
  protected lastPointerType = 'mouse';

  protected onPointerMove(event: PointerEvent): void {
    // While voting on a phone, a finger sliding over a bubble must not open its profile (see onClick).
    if (this.isVoting() && event.pointerType === 'touch') return;
    this.setHovered(this.hit(event), event);
  }

  protected onPointerLeave(): void {
    this.hoveredId.set(null);
    this.scheduleHide();
  }

  /** Short grace period so the pointer can move from the canvas onto the tooltip. */
  protected scheduleHide(): void {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => this.hideTooltip(), 150);
  }

  protected keepTooltip(): void {
    clearTimeout(this.hideTimeout);
  }

  private hideTooltip(): void {
    this.userProfileService.hide(this.tooltipScope);
    this.tooltipUserId.set(null);
  }

  private setHovered(hit: CandidateState | null, event?: PointerEvent): void {
    const id = hit?.id ?? null;
    if (id === this.hoveredId()) return;
    clearTimeout(this.hideTimeout);
    this.hoveredId.set(id);
    if (!hit || !event) {
      this.scheduleHide();
      return;
    }
    this.hideTooltip();
    const user = this.bubbles().find(b => b.votedUser.id === id)?.votedUser;
    if (!user) return;
    this.placeTooltip(event);
    this.tooltipUserId.set(id);
    this.userProfileService.show(user, this.tooltipScope);
  }

  protected onClick(event: MouseEvent): void {
    const hit = this.hit(event);
    if (!hit) return;
    if (!this.isVoting()) {
      this.showTooltipNow(hit.id, event);
      return;
    }
    // Voting with a mouse: the click only (un)selects, the profile opens on hover.
    if (this.lastPointerType !== 'touch') {
      this.select(hit.id);
      return;
    }
    // Voting on a phone: 1st tap selects, a tap on the selected bubble opens its profile, the next one unselects it.
    const selected = this.selectedIds().includes(hit.id);
    const profileOpen = this.tooltipUserId() === hit.id && this.userProfileService.isOpenFor(this.tooltipUser(), this.tooltipScope);
    if (selected && !profileOpen) {
      this.showTooltipNow(hit.id, event);
      return;
    }
    clearTimeout(this.hideTimeout);
    this.hideTooltip();
    this.select(hit.id);
  }

  private showTooltipNow(id: number, event: MouseEvent): void {
    const user = this.bubbles().find(b => b.votedUser.id === id)?.votedUser;
    if (!user) return;
    clearTimeout(this.hideTimeout);
    this.placeTooltip(event);
    this.tooltipUserId.set(id);
    this.userProfileService.showNow(user, this.tooltipScope);
  }

  protected select(id: number): void {
    if (!this.isVoting()) return;
    this.selectedIds.update(ids => {
      if (ids.includes(id)) return ids.filter(i => i !== id);
      return this.multiple() ? [...ids, id] : [id];
    });
  }

  protected confirm(): void {
    const ids = this.selectedIds();
    if (ids.length && this.isVoting()) this.voted.emit(ids);
  }

  /** The tooltip keeps its natural size: near the right/bottom edge it flips to the other side of the pointer. */
  private placeTooltip(event: MouseEvent): void {
    const rect = this.boxRef().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    this.tooltipPos.set({
      x, y,
      flipX: x + TOOLTIP_WIDTH > rect.width && x > TOOLTIP_WIDTH / 2,
      flipY: y + TOOLTIP_HEIGHT > rect.height && y > TOOLTIP_HEIGHT,
    });
  }

  private hit(event: MouseEvent): CandidateState | null {
    const rect = this.boxRef().nativeElement.getBoundingClientRect();
    return this.engine.hitTest(event.clientX - rect.left, event.clientY - rect.top);
  }

  private pictureUrl(user: User): string | null {
    return user.profile_picture ? `${environment.apiUrl}/auth/profile-picture/${user.profile_picture}` : null;
  }

  // --- Boucle & responsive -------------------------------------------------

  private setupResize(): void {
    const box = this.boxRef().nativeElement;
    let lastKey = '';
    const measureObstacle = () => {
      const o = this.obstacleRef().nativeElement.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      // engine/canvas coordinates start inside the border, so remove the border offset
      this.engine.setObstacles(o.width && o.height
        ? [{ x: o.left - b.left - box.clientLeft, y: o.top - b.top - box.clientTop, width: o.width, height: o.height }]
        : []);
    };
    const resize = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      const key = `${width}x${height}@${dpr}`;
      // The card (obstacle) can resize often: only reallocate the canvas when the box really changed.
      if (key === lastKey) {
        measureObstacle();
        return;
      }
      lastKey = key;
      const canvas = this.canvasRef().nativeElement;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const compact = width < 480;
      Object.assign(this.engine.options, {
        minRadius: compact ? 30 : 38, maxRadius: compact ? 70 : 90, voterRadius: compact ? 13 : 16,
        speedFactor: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.3 : 1,
      });
      this.engine.resize(width, height);
      measureObstacle();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    observer.observe(this.obstacleRef().nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
    resize();
  }

  private loop(time: number): void {
    const dt = this.lastTime ? (time - this.lastTime) / 1000 : 0;
    this.lastTime = time;
    this.engine.step(dt);
    this.draw(time / 1000);
    this.frame = requestAnimationFrame(t => this.loop(t));
  }

  // --- Rendu ---------------------------------------------------------------

  private draw(t: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.engine.width, this.engine.height);
    this.drawDecor(ctx, t);

    const hovered = this.hoveredId();
    const selected = this.selectedIds();
    this.engine.voterPositions().forEach(v =>
      this.drawBall(ctx, v.x, v.y, v.r, v.voter.name, v.voter.picture, v.owner.id, false, false));
    // les plus gros d'abord : les petits restent visibles et cliquables au-dessus
    [...this.engine.candidates]
      .sort((a, b) => b.r - a.r)
      .forEach(c => this.drawBall(ctx, c.x, c.y, c.r, c.name, c.picture, c.id, selected.includes(c.id) && this.isVoting(), c.id === hovered && this.isVoting()));
    this.engine.candidates.forEach(c => c.answer && this.drawSpeech(ctx, c));
  }

  /** Speech bubble with the user's written answer, on the side of the ball that has room. */
  private drawSpeech(ctx: CanvasRenderingContext2D, c: CandidateState): void {
    const { width: w, height: h } = this.engine;
    const text = c.answer ?? '';
    const maxWidth = Math.min(Math.max(w * 0.32, 110), 200);
    const font = '600 13px sans-serif';
    const lineHeight = 17, padX = 10, padY = 8, gap = 10, tail = 8;

    let entry = this.speech.get(c.id);
    const key = `${text}|${maxWidth}`;
    if (!entry || entry.key !== key) {
      ctx.font = font;
      const lines = this.wrap(ctx, text, maxWidth - 2 * padX, 4);
      const width = Math.max(...lines.map(l => ctx.measureText(l).width)) + 2 * padX;
      entry = { key, lines, width, side: entry?.side ?? 'right' };
      this.speech.set(c.id, entry);
    }

    const bw = entry.width, bh = entry.lines.length * lineHeight + 2 * padY;
    const fitsRight = c.x + c.r + gap + tail + bw <= w;
    const fitsLeft = c.x - c.r - gap - tail - bw >= 0;
    // keep the current side (no flicker) unless it no longer fits and the other one does
    if (entry.side === 'right' && !fitsRight && fitsLeft) entry.side = 'left';
    else if (entry.side === 'left' && !fitsLeft && fitsRight) entry.side = 'right';
    else if (!fitsRight && !fitsLeft) entry.side = c.x < w / 2 ? 'right' : 'left';

    const dir = entry.side === 'right' ? 1 : -1;
    const x = dir === 1 ? c.x + c.r + gap + tail : c.x - c.r - gap - tail - bw;
    const y = Math.min(Math.max(c.y - bh / 2, 4), Math.max(4, h - bh - 4));
    const color = PALETTE[Math.abs(c.id) % PALETTE.length];
    const tailY = Math.min(Math.max(c.y, y + 12), y + bh - 12);
    const tailX = dir === 1 ? x : x + bw;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, 12);
    ctx.moveTo(tailX, tailY - 7);
    ctx.lineTo(tailX - dir * tail, tailY);
    ctx.lineTo(tailX, tailY + 7);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,.18)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    // hide the stroke segment between bubble and tail
    ctx.beginPath();
    ctx.moveTo(tailX, tailY - 6);
    ctx.lineTo(tailX, tailY + 6);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.font = font;
    ctx.fillStyle = '#2b2b2b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    entry.lines.forEach((line, i) => ctx.fillText(line, x + padX, y + padY + lineHeight * (i + 0.5)));
    ctx.restore();
  }

  /** Word-wraps text (breaking over-long words) and cuts it with an ellipsis after `maxLines`. */
  private wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
    const lines: string[] = [];
    let current = '';
    const push = () => { lines.push(current); current = ''; };
    for (const word of text.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (ctx.measureText(w).width > maxWidth) {
        let n = w.length - 1;
        while (n > 1 && ctx.measureText(w.slice(0, n)).width > maxWidth) n--;
        if (current) push();
        lines.push(w.slice(0, n));
        w = w.slice(n);
      }
      const candidate = current ? `${current} ${w}` : w;
      if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
      else { push(); current = w; }
    }
    if (current) push();
    if (lines.length > maxLines) {
      lines.length = maxLines;
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines.length ? lines : [''];
  }

  /** Agar.io-style background: scattered food pellets and a couple of green spiky viruses. */
  private drawDecor(ctx: CanvasRenderingContext2D, t: number): void {
    const { width: w, height: h } = this.engine;
    const count = Math.min(PELLET_COUNT, Math.round((w * h) / 6500));

    const virusRadius = Math.min(Math.max(Math.min(w, h) * 0.085, 26), 52);

    for (const v of this.viruses) {
      const r = virusRadius;
      const x = v.x * w, y = v.y * h;
      const pulse = 1 + Math.sin(t * 1.6 + v.phase) * 0.025;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.3 + v.phase) * 0.15);
      ctx.beginPath();
      for (let i = 0; i < VIRUS_SPIKES * 2; i++) {
        const angle = (i / (VIRUS_SPIKES * 2)) * Math.PI * 2;
        const radius = (i % 2 ? r * 0.88 : r * 1.08) * pulse;
        const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#33ff33';
      ctx.fill();
      ctx.lineWidth = Math.max(3, r * 0.1);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#2ed02e';
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < count; i++) {
      const p = this.pellets[i];
      // Centre stays inside the box: a pellet on the edge is at most half cut, never more.
      const x = Math.min(w, Math.max(0, p.x * w + Math.sin(t * 0.6 + p.phase) * 2));
      const y = Math.min(h, Math.max(0, p.y * h + Math.cos(t * 0.5 + p.phase) * 2));
      // Never show a pellet on top of (or poking out of the notches of) a virus.
      if (this.viruses.some(v => Math.hypot(x - v.x * w, y - v.y * h) < virusRadius * 1.1 + p.r)) continue;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.stroke();
    }
  }

  private drawBall(
    ctx: CanvasRenderingContext2D, x: number, y: number, r: number, name: string, picture: string | null,
    colorKey: number, selected: boolean, hovered: boolean,
  ): void {
    const color = PALETTE[Math.abs(colorKey) % PALETTE.length];
    ctx.save();
    ctx.translate(x, y);

    if (selected || hovered) {
      ctx.shadowColor = selected ? '#1982c4' : 'rgba(0,0,0,.35)';
      ctx.shadowBlur = selected ? 22 : 12;
    }
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.clip();

    // Moitié haute : photo, découpée par la diagonale.
    ctx.save();
    ctx.rotate(SPLIT_ANGLE);
    ctx.beginPath();
    ctx.rect(-r - 1, -r - 1, 2 * r + 2, r + 1);
    ctx.clip();
    ctx.rotate(-SPLIT_ANGLE);
    const img = this.image(picture);
    if (img.complete && img.naturalWidth) {
      const size = 2 * r;
      const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(-r, -r, 2 * r, 2 * r);
    }
    ctx.restore();

    // Moitié basse : pseudo.
    ctx.save();
    ctx.rotate(SPLIT_ANGLE);
    ctx.beginPath();
    ctx.rect(-r - 1, 0, 2 * r + 2, r + 1);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(-r, 0, 2 * r, r);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(8, r * 0.34);
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.fillText(this.fit(ctx, name, r * 1.6), 0, r * 0.5);
    ctx.restore();

    // Ligne de séparation.
    ctx.save();
    ctx.rotate(SPLIT_ANGLE);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Contour (hors clip).
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeStyle = selected ? '#1982c4' : 'rgba(0,0,0,.45)';
    ctx.stroke();
    ctx.restore();
  }

  private fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
    return t + '…';
  }

  private image(url: string | null): HTMLImageElement {
    const src = url ?? DEFAULT_PICTURE;
    let img = this.images.get(src);
    if (!img) {
      img = new Image();
      img.onerror = () => {
        if (img!.src.endsWith(DEFAULT_PICTURE)) return;
        img!.src = DEFAULT_PICTURE;
      };
      img.src = src;
      this.images.set(src, img);
    }
    return img;
  }
}
