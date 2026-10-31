import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { savePostLoginRedirect } from '../../utils/post-login-redirect';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Back to this page once logged in (e.g. an invitation link: the user still joins the group).
  savePostLoginRedirect(state.url);
  return router.parseUrl('/auth');
};
