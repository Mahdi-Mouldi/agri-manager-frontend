import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { FarmersComponent } from './components/farmers/farmers';         // ← ajouter
import { ParcellesComponent } from './components/parcelles/parcelles';   // ← ajouter
import { MainLayout } from './components/main-layout/main-layout';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'farmers',   component: FarmersComponent },    // ← corrigé
      { path: 'parcelles', component: ParcellesComponent },  // ← ajouté
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];