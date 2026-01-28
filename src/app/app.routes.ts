import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { AuthGuard } from 'src/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    component: HomePage,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./pages/transactions/transactions.page').then(
            (m) => m.TransactionsPage,
          ),
      },
      {
        path: 'fixed-expenses',
        loadComponent: () =>
          import('./pages/fixed-expenses/fixed-expenses.page').then(
            (m) => m.FixedExpensesPage,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },
];
