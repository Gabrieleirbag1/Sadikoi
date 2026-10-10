import { Routes } from '@angular/router';
import { authGuard } from './guards/auth/auth.guard';

export const routes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) 
    },
    {
        path: 'auth',
        loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) 
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'reset-password/:token',
        loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    },
    {
        path: 'group/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./components/group/group.component').then(m => m.GroupComponent) 
    },
    {
        path: 'group/invitations/:token',
        canActivate: [authGuard],
        loadComponent: () => import('./components/answer.invitation/answer.invitation.component').then(m => m.AnswerInvitationComponent)
    },
    {
        path: 'legal',
        data: { doc: 'legal' },
        loadComponent: () => import('./components/legal/legal-page.component').then(m => m.LegalPageComponent)
    },
    {
        path: 'privacy',
        data: { doc: 'privacy' },
        loadComponent: () => import('./components/legal/legal-page.component').then(m => m.LegalPageComponent)
    },
    {
        path: 'terms',
        data: { doc: 'terms' },
        loadComponent: () => import('./components/legal/legal-page.component').then(m => m.LegalPageComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
