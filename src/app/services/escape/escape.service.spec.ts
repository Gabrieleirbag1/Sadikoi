import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { closeOnEscape, EscapeService } from './escape.service';

describe('EscapeService', () => {
  const press = (init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, ...init });
    document.dispatchEvent(event);
    return event;
  };

  it('closes only the popup opened last, then the one under it', () => {
    const escape = TestBed.inject(EscapeService);
    const closed: string[] = [];
    escape.add(() => closed.push('options'));
    const removeConfirm = escape.add(() => { closed.push('confirm'); removeConfirm(); });

    press();
    expect(closed).toEqual(['confirm']);
    press();
    expect(closed).toEqual(['confirm', 'options']);
  });

  it('leaves an Escape already handled (chat suggestions) and other keys alone', () => {
    const close = vi.fn();
    TestBed.inject(EscapeService).add(close);
    const handled = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    handled.preventDefault();
    document.dispatchEvent(handled);
    press({ key: 'Enter' });
    expect(close).not.toHaveBeenCalled();
    expect(press().defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });

  it('closeOnEscape follows the open state', () => {
    const open = signal(false);
    const close = vi.fn(() => open.set(false));
    TestBed.runInInjectionContext(() => closeOnEscape(close, open));

    TestBed.tick();
    press();
    expect(close).not.toHaveBeenCalled();

    open.set(true);
    TestBed.tick();
    press();
    expect(close).toHaveBeenCalledOnce();

    TestBed.tick();
    press();
    expect(close).toHaveBeenCalledOnce();
  });
});
