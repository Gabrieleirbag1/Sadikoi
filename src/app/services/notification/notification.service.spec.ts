import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('adds error and success toasts', () => {
    service.showError('boom');
    service.showSuccess('ok');
    expect(service.toasts().map(t => t.type)).toEqual(['error', 'success']);
  });

  it('does not duplicate identical toasts', () => {
    service.showError('boom');
    service.showError('boom');
    expect(service.toasts().length).toBe(1);
  });

  it('dismisses a toast', () => {
    service.showError('boom');
    service.dismiss(service.toasts()[0].id);
    expect(service.toasts().length).toBe(0);
  });

  it('keeps at most 5 toasts', () => {
    for (let i = 0; i < 8; i++) service.showError(`e${i}`);
    expect(service.toasts().length).toBe(5);
    expect(service.toasts()[0].message).toBe('e3');
  });
});
