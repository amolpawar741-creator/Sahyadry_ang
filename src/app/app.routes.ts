import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'customers', loadComponent: () => import('./pages/customers.component').then(m => m.CustomersComponent) },
      { path: 'customers/new', loadComponent: () => import('./pages/customer-form.component').then(m => m.CustomerFormComponent) },
      { path: 'customers/:id/edit', loadComponent: () => import('./pages/customer-form.component').then(m => m.CustomerFormComponent) },
      { path: 'customers/:id', loadComponent: () => import('./pages/customer-detail.component').then(m => m.CustomerDetailComponent) },
      { path: 'agents', loadComponent: () => import('./pages/agents.component').then(m => m.AgentsComponent) },
      { path: 'followups', loadComponent: () => import('./pages/followups.component').then(m => m.FollowUpsComponent) },
      { path: 'plots', loadComponent: () => import('./pages/plots.component').then(m => m.PlotsComponent) },
      { path: 'quotations', loadComponent: () => import('./pages/quotations.component').then(m => m.QuotationsComponent) },
    ] },
  { path: '**', redirectTo: '' }
];
