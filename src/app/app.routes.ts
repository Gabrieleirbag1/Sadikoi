import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) 
    },
    {
        path: 'register',
        loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) 
    }
];
