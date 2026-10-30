import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileService } from '../../services/user-profile/user-profile.service';
import { VoteBubblesComponent } from './vote-bubbles.component';

const alice = { id: 1, username: 'alice', profile_picture: null } as unknown as User;

describe('VoteBubblesComponent, voting on a phone', () => {
  let fixture: ComponentFixture<VoteBubblesComponent>;
  let canvas: HTMLCanvasElement;
  let profiles: UserProfileService;

  /** jsdom has no PointerEvent: a MouseEvent with a pointerType does the same for the handlers. */
  const pointer = (type: string, x = 0, y = 0) => {
    const event = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    canvas.dispatchEvent(event);
  };
  const lift = (x = 0, y = 0) => {
    pointer('pointerup', x, y);
    pointer('pointerleave', x, y);
    canvas.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
  };
  const profileOpen = () => profiles.isOpenFor(alice, 'vote-bubbles');

  beforeEach(async () => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(VoteBubblesComponent);
    fixture.componentRef.setInput('bubbles', [{ votedUser: alice, voters: [] }]);
    fixture.componentRef.setInput('phase', 'voting');
    fixture.detectChanges();
    vi.advanceTimersByTime(50); // first frames: the box has no size in jsdom, so the only ball sits at (0, 0)
    canvas = fixture.nativeElement.querySelector('canvas');
    profiles = TestBed.inject(UserProfileService);
  });

  afterEach(() => vi.useRealTimers());

  it('a tap selects the ball without opening its profile', () => {
    pointer('pointerdown');
    vi.advanceTimersByTime(100);
    lift();
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.selectedIds()).toEqual([1]);
    expect(profileOpen()).toBe(false);

    pointer('pointerdown');
    lift();
    expect(fixture.componentInstance.selectedIds()).toEqual([]); // a 2nd tap unselects
    expect(profileOpen()).toBe(false);
  });

  it('a long press opens the profile, which stays open once the finger is lifted', () => {
    pointer('pointerdown');
    vi.advanceTimersByTime(600);
    expect(profileOpen()).toBe(true);

    lift();
    vi.advanceTimersByTime(1000);
    expect(profileOpen()).toBe(true);
    expect(fixture.componentInstance.selectedIds()).toEqual([]); // holding doesn't vote

    pointer('pointerdown'); // the next tap closes it (and selects)
    lift();
    vi.advanceTimersByTime(1000);
    expect(profileOpen()).toBe(false);
    expect(fixture.componentInstance.selectedIds()).toEqual([1]);
  });

  it('a finger that slides is not a long press', () => {
    pointer('pointerdown');
    pointer('pointermove', 30, 0);
    vi.advanceTimersByTime(600);
    expect(profileOpen()).toBe(false);
  });
});
