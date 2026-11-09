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

    describe('typing in the growing field', () => {
      let textarea: HTMLTextAreaElement;

      // Measuring the field makes the thread taller for a moment: the browser pulls its scroll up.
      const type = () => {
        textarea.value += 'd';
        textarea.dispatchEvent(new Event('input'));
      };

      beforeEach(() => {
        textarea = fixture.nativeElement.querySelector('.chat-input-area textarea');
        Object.defineProperty(textarea.style, 'height', {
          configurable: true,
          get: () => '',
          set: (v: string) => { if (v === 'auto') container.scrollTop -= 50; },
        });
      });

      it('stays at the bottom', () => {
        scrollUserTo(700);
        type();
        container.dispatchEvent(new Event('scroll')); // fired late by the browser
        expect(container.scrollTop).toBe(1000);
        expect((component as any).stickToBottom).toBe(true);
      });

      it('keeps the messages being read when scrolled up', () => {
        scrollUserTo(700);
        scrollUserTo(300);
        type();
        expect(container.scrollTop).toBe(300);
      });
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

    it('spaces and blank lines around the message are dropped, a blank message is not sent', async () => {
      await (component as any).sendMessage(' \n  hi\n there \n\n  ');
      expect(send.mock.calls[0][1]).toBe('hi\n there');
      await (component as any).sendMessage(' \n ');
      expect(send).toHaveBeenCalledOnce();
    });
  });

  describe('character counter', () => {
    const typeIn = (text: string) => {
      const textarea = fixture.nativeElement.querySelector('.chat-input-area textarea') as HTMLTextAreaElement;
      textarea.value = text;
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.chat-input-counter') as HTMLElement | null;
    };

    it('the field is limited to 500 characters', () => {
      const textarea = fixture.nativeElement.querySelector('.chat-input-area textarea') as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(500);
    });

    it('shows up from 80% of the limit, and is highlighted once full', () => {
      expect(typeIn('a'.repeat(399))).toBeNull();
      expect(typeIn('a'.repeat(400))?.textContent?.trim()).toBe('400/500');
      expect(typeIn('a'.repeat(500))?.classList).toContain('full');
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

  describe('mentions', () => {
    const alice = { id: 2, username: 'alice', items: [], role: 'member' } as unknown as User;
    const alan = { id: 3, username: 'Alan Turing', items: [], role: 'member' } as unknown as User;
    const bob = { id: 4, username: 'bob', items: [], role: 'member' } as unknown as User;

    const textarea = () => fixture.nativeElement.querySelector('.chat-input-area textarea') as HTMLTextAreaElement;
    const suggestions = () =>
      [...fixture.nativeElement.querySelectorAll('.mention-suggestion-name')].map((el: Element) => el.textContent?.trim());
    const typeIn = (text: string) => {
      textarea().value = text;
      textarea().setSelectionRange(text.length, text.length);
      textarea().dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const press = (key: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
      textarea().dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };

    beforeEach(() => {
      fixture.componentRef.setInput('group', { id: 1, users: [alice, alan, bob] } as unknown as Group);
      fixture.detectChanges();
    });

    afterEach(() => (component as any).closeProfile());

    it('shows mentions of members in blue and opens their profile on click', () => {
      (component as any).messages.set([{ id: 1, content: 'hey @Alice and @nobody', sender: bob, timestamp: '2025-01-01T10:00:00' }]);
      fixture.detectChanges();
      const content = fixture.nativeElement.querySelector('.message-content') as HTMLElement;
      expect(content.textContent).toBe('hey @Alice and @nobody');
      const mentions = content.querySelectorAll('.chat-mention');
      expect([...mentions].map(m => m.textContent)).toEqual(['@Alice']);

      (mentions[0] as HTMLElement).click();
      fixture.detectChanges();
      expect((component as any).profileUser()).toBe(alice);
      expect(fixture.nativeElement.querySelector('.chat-profile-popover app-user-profile')).toBeTruthy();
    });

    it('suggests the members matching the name being typed', () => {
      typeIn('salut @al');
      expect(suggestions()).toEqual(['Alan Turing', 'alice']);
      typeIn('salut @ali');
      expect(suggestions()).toEqual(['alice']);
      typeIn('salut @x');
      expect(suggestions()).toEqual([]);
      typeIn('salut');
      expect(suggestions()).toEqual([]);
    });

    it('arrows pick the suggestion, Enter completes the name instead of sending', () => {
      const send = vi.fn();
      TestBed.inject(ChatService).sendMessage = send as unknown as ChatService['sendMessage'];
      typeIn('yo @al');
      press('ArrowDown');
      const enter = press('Enter');
      expect(enter.defaultPrevented).toBe(true);
      expect(textarea().value).toBe('yo @alice ');
      expect(textarea().selectionStart).toBe(10);
      expect(suggestions()).toEqual([]);
      expect(send).not.toHaveBeenCalled();
    });

    it('clicking a suggestion completes the name, keeping the text after the cursor', () => {
      typeIn('yo @b');
      textarea().value = 'yo @b ça va';
      textarea().setSelectionRange(5, 5);
      (fixture.nativeElement.querySelector('.mention-suggestion') as HTMLElement).click();
      expect(textarea().value).toBe('yo @bob ça va');
    });

    it('Escape closes the suggestions', () => {
      typeIn('@a');
      press('Escape');
      expect(suggestions()).toEqual([]);
    });
  });
});
