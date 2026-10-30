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
});
