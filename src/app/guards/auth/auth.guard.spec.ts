import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../../services/auth/auth.service';
import { takePostLoginRedirect } from '../../utils/post-login-redirect';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));
  const visit = (url: string) => executeGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot);
  let authenticated = false;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthenticated: () => authenticated } }],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('logged out: sends to the login page and keeps the page for after it', () => {
    authenticated = false;
    const result = visit('/group/invitations/abc');
    expect((result as UrlTree).toString()).toBe('/auth');
    expect(takePostLoginRedirect()).toBe('/group/invitations/abc');
  });

  it('logged in: lets through and saves nothing', () => {
    authenticated = true;
    expect(visit('/group/invitations/abc')).toBe(true);
    expect(takePostLoginRedirect()).toBeNull();
  });
});
