import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { TutorialService } from '../tutorial/tutorial.service';
import { savePostLoginRedirect } from '../../utils/post-login-redirect';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('after logging in', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('user', JSON.stringify({ id: 5, date_created: new Date().toUTCString() }));
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    });

    afterEach(() => localStorage.clear());

    it('an account made to answer an invitation skips the welcome popup', async () => {
      savePostLoginRedirect('/group/invitations/abc');
      await service.redirectAfterLogin();
      expect(TestBed.inject(TutorialService).shouldWelcome()).toBe(false);
    });

    it('a new account landing on the home page gets the welcome popup', async () => {
      await service.redirectAfterLogin();
      expect(TestBed.inject(TutorialService).shouldWelcome()).toBe(true);
    });
  });
});
