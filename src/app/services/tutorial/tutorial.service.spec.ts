import { TestBed } from '@angular/core/testing';
import { TutorialService } from './tutorial.service';

const HOUR = 60 * 60 * 1000;

describe('TutorialService', () => {
  let service: TutorialService;

  const logInAs = (id: number, createdAgoMs = 0) =>
    localStorage.setItem('user', JSON.stringify({ id, date_created: new Date(Date.now() - createdAgoMs).toUTCString() }));

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(TutorialService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('remembers each step per account', () => {
    logInAs(1);
    service.markSeen('vote');
    expect(service.isSeen('vote')).toBe(true);
    expect(service.isSeen('results')).toBe(false);

    logInAs(2);
    expect(service.isSeen('vote')).toBe(false);
  });

  it('welcomes a just created account, once', () => {
    logInAs(1, HOUR);
    expect(service.shouldWelcome()).toBe(true);
    service.markSeen('welcome');
    expect(service.shouldWelcome()).toBe(false);
  });

  it('never welcomes an existing account', () => {
    logInAs(1, 30 * 24 * HOUR);
    expect(service.shouldWelcome()).toBe(false);
  });

  it('shows nothing when storage is unavailable, rather than at every visit', () => {
    logInAs(1);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => {
      if (key === 'user') return JSON.stringify({ id: 1, date_created: new Date().toUTCString() });
      throw new Error('blocked');
    });
    expect(service.isSeen('vote')).toBe(true);
    expect(service.shouldWelcome()).toBe(false);
  });

  it('shows nothing when logged out', () => {
    expect(service.isSeen('vote')).toBe(true);
    expect(service.shouldWelcome()).toBe(false);
  });
});
