import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FitTextDirective } from './fit-text.directive';

const MAX_SIZE = 32;
const LINE_HEIGHT = 1.2;
const WIDTH = 300;

@Component({
  imports: [FitTextDirective],
  template: `<p [appFitText]="text()" [minFontSize]="16">{{ text() }}</p>`,
  styles: `p { font-size: ${MAX_SIZE}px; line-height: ${LINE_HEIGHT}; }`,
})
class Host {
  readonly text = signal('');
}

describe('FitTextDirective', () => {
  let fixture: ComponentFixture<Host>;
  let el: HTMLElement;

  /** jsdom has no layout: each character is half the font size wide, wrapped at WIDTH. */
  const fontSize = () => parseFloat(el.style.fontSize || `${MAX_SIZE}`);
  const lines = () => Math.max(1, Math.ceil((el.textContent!.length * fontSize() * 0.5) / WIDTH));

  async function show(text: string): Promise<void> {
    fixture.componentInstance.text.set(text);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    el = fixture.nativeElement.querySelector('p');
    Object.defineProperty(el, 'offsetHeight', { get: () => lines() * fontSize() * LINE_HEIGHT });
    await fixture.whenStable();
  });

  it('keeps the stylesheet size when the text fits on 2 lines', async () => {
    await show('A short question?');
    expect(el.style.fontSize).toBe('');
    expect(el.classList).not.toContain('fit-text-clamped');
  });

  it('shrinks a long text until it fits on 2 lines', async () => {
    await show('x'.repeat(50)); // 3 lines at 32px, 2 lines from 24px
    expect(fontSize()).toBe(24);
    expect(lines()).toBe(2);
    expect(el.classList).not.toContain('fit-text-clamped');
  });

  it('stops at the minimum size and clamps what still overflows', async () => {
    await show('x'.repeat(200));
    expect(fontSize()).toBe(16);
    expect(el.classList).toContain('fit-text-clamped');
  });

  it('grows back for a shorter text', async () => {
    await show('x'.repeat(200));
    await show('Short');
    expect(el.style.fontSize).toBe('');
    expect(el.classList).not.toContain('fit-text-clamped');
  });
});
