import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat/chat.service';

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

  describe('sending a message', () => {
    let send: ReturnType<typeof vi.fn>;
    let input: HTMLInputElement;

    beforeEach(() => {
      send = vi.fn().mockResolvedValue({ id: 1 });
      TestBed.inject(ChatService).sendMessage = send as unknown as ChatService['sendMessage'];
      fixture.componentRef.setInput('group', { id: 7 } as Group);
      input = document.createElement('input');
    });

    it('a second tap while the first send is on its way sends nothing more', async () => {
      input.value = 'hi';
      const first = (component as any).sendMessage(input.value, input);
      await (component as any).sendMessage(input.value, input); // the input is already empty
      await first;
      expect(send).toHaveBeenCalledOnce();
    });

    it('a failed message gives its text back and is resent with the same id', async () => {
      send.mockResolvedValueOnce(null);
      input.value = 'hi';
      await (component as any).sendMessage(input.value, input);
      expect(input.value).toBe('hi');
      await (component as any).sendMessage(input.value, input);
      expect(send).toHaveBeenCalledTimes(2);
      expect(send.mock.calls[1][3]).toBe(send.mock.calls[0][3]);
      expect(input.value).toBe('');
    });

    it('each new message gets its own id', async () => {
      await (component as any).sendMessage('a');
      await (component as any).sendMessage('b');
      expect(send.mock.calls[0][3]).not.toBe(send.mock.calls[1][3]);
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
