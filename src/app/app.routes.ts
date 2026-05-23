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
        path: 'join',
        canActivate: [authGuard],
        loadComponent: () => import('./components/join.group/join.group.component').then(m => m.JoinGroupComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
