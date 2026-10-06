import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input,
  model, NgZone, output, signal, viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UserProfileService } from '../../services/user-profile/user-profile.service';
import { UserProfileComponent } from '../tooltips/user-profile/user-profile.component';
import { environment } from '../../../environments/environment.development';
import { BubbleCandidate, BubbleEngine, BubbleVoter, CandidateState } from './vote-bubbles.engine';

export interface VoteBubbleData {
  votedUser: User;
  voters: User[];
}

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
  public readonly phase = input<'voting' | 'results'>('results');
  public readonly disabled = input(false);
  /** Allow selecting several candidates (question.enableMultipleVoting). */
  public readonly multiple = input(false);
  public readonly selectedIds = model<number[]>([]);
  public readonly voted = output<number[]>();

  protected readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly boxRef = viewChild.required<ElementRef<HTMLElement>>('box');

  protected readonly hoveredId = signal<number | null>(null);
  protected readonly isVoting = computed(() => this.phase() === 'voting' && !this.disabled());
  protected readonly candidates = computed<BubbleCandidate[]>(() =>
    this.bubbles().map(b => ({
      id: b.votedUser.id,
      name: b.votedUser.username,
      picture: this.pictureUrl(b.votedUser),
      voters: b.voters.map<BubbleVoter>(v => ({ id: v.id, name: v.username, picture: this.pictureUrl(v) })),
    })),
  );
  protected readonly hoveredUser = computed(() => this.bubbles().find(b => b.votedUser.id === this.hoveredId())?.votedUser ?? null);
  protected readonly tooltipPos = signal({ x: 0, y: 0 });

  private readonly engine = new BubbleEngine();
  private readonly images = new Map<string, HTMLImageElement>();
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
      if (this.ready) this.engine.sync(data);
    });

    effect(() => {
      const ids = this.selectedIds();
      this.engine.freeze(this.isVoting() && ids.length ? ids[ids.length - 1] : null);
    });

    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.frame));
  }

  protected onPointerMove(event: PointerEvent): void {
    this.setHovered(this.hit(event), event);
  }

  protected onPointerLeave(): void {
    this.setHovered(null);
  }

  private setHovered(hit: CandidateState | null, event?: PointerEvent): void {
    const id = hit?.id ?? null;
    if (id === this.hoveredId()) return;
    this.userProfileService.hide(this.tooltipScope);
    this.hoveredId.set(id);
    if (!hit || !event) return;
    const user = this.bubbles().find(b => b.votedUser.id === id)?.votedUser;
    if (!user) return;
    const rect = this.boxRef().nativeElement.getBoundingClientRect();
    this.tooltipPos.set({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    this.userProfileService.show(user, this.tooltipScope);
  }

  protected onClick(event: MouseEvent): void {
    const hit = this.hit(event);
    if (!hit) return;
    const user = this.bubbles().find(b => b.votedUser.id === hit.id)?.votedUser;
    if (user) {
      const rect = this.boxRef().nativeElement.getBoundingClientRect();
      this.tooltipPos.set({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      this.userProfileService.showNow(user, this.tooltipScope);
    }
    if (this.isVoting()) this.select(hit.id);
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
    const resize = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (!width || !height) return;
      const canvas = this.canvasRef().nativeElement;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const compact = width < 480;
      Object.assign(this.engine.options, {
        minRadius: compact ? 30 : 38, maxRadius: compact ? 70 : 90, voterRadius: compact ? 13 : 16,
        speedFactor: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.3 : 1,
      });
      this.engine.resize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(box);
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
  }

  /** Agar.io-style background: scattered food pellets and a couple of green spiky viruses. */
  private drawDecor(ctx: CanvasRenderingContext2D, t: number): void {
    const { width: w, height: h } = this.engine;
    const count = Math.min(PELLET_COUNT, Math.round((w * h) / 6500));

    for (const v of this.viruses) {
      const r = Math.min(Math.max(Math.min(w, h) * 0.085, 26), 52);
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
      const x = p.x * w + Math.sin(t * 0.6 + p.phase) * 2;
      const y = p.y * h + Math.cos(t * 0.5 + p.phase) * 2;
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
