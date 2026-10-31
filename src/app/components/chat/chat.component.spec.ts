import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sticking to the bottom', () => {
    let container: HTMLElement;
    let scrollTo: ReturnType<typeof vi.fn>;

    const scrollUserTo = (top: number) => {
      container.scrollTop = top;
      container.dispatchEvent(new Event('scroll'));
    };

    beforeEach(() => {
      container = fixture.nativeElement.querySelector('.chat-messages-container');
      Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(container, 'clientHeight', { configurable: true, value: 300 });
      let top = 0;
      Object.defineProperty(container, 'scrollTop', { configurable: true, get: () => top, set: v => (top = v) });
      scrollTo = vi.fn();
      container.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];
    });

    it('a smooth scroll still on its way down does not unpin (late GIFs still reach the bottom)', () => {
      scrollUserTo(200); // mid-animation, far from the bottom
      (component as any).autoScroll('instant'); // a GIF finished loading
      expect(scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'instant' });
    });

    it('scrolling up stops following new content, coming back down resumes it', () => {
      scrollUserTo(700);
      scrollUserTo(400); // the user scrolls up to read
      (component as any).autoScroll('instant');
      expect(scrollTo).not.toHaveBeenCalled();

      scrollUserTo(690); // back at the bottom
      (component as any).autoScroll('instant');
      expect(scrollTo).toHaveBeenCalledOnce();
    });
  });

  describe('author profile', () => {
    const sender = { id: 2, username: 'bob', email: '', date_created: '2025-01-01', language: 'fr' } as unknown as User;
    const member = { ...sender, items: [], role: 'member' } as User;

    const avatar = () => fixture.nativeElement.querySelector('.chat-avatar-btn') as HTMLButtonElement;
    const card = () => fixture.nativeElement.querySelector('.chat-profile-popover app-user-profile');

    beforeEach(async () => {
      fixture.componentRef.setInput('group', { id: 1, users: [member] } as unknown as Group);
      (component as any).messages.set([{ id: 1, content: 'hi', sender, timestamp: '2025-01-01T10:00:00' }]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    afterEach(() => (component as any).closeProfile());

    it('clicking the picture opens the group member profile, clicking it again closes it', () => {
      avatar().click();
      fixture.detectChanges();
      expect(card()).toBeTruthy();
      expect((component as any).profileUser()).toBe(member);

      avatar().click();
      fixture.detectChanges();
      expect(card()).toBeNull();
    });

    it('a click elsewhere closes the profile', () => {
      avatar().click();
      fixture.detectChanges();
      document.body.click();
      fixture.detectChanges();
      expect(card()).toBeNull();
    });
  });
});
