import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { AuthGuard } from 'src/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    canActivate: [AuthGuard], // Add your guards here if needed
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home-guard/home-guard.page').then(
            (m) => m.HomeGuardPage,
          ),
      },
    ],
  },
];
