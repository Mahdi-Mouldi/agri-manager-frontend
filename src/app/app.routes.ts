import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { FarmersComponent } from './components/farmers/farmers';         // ← ajouter
import { ParcellesComponent } from './components/parcelles/parcelles';   // ← ajouter
import { MainLayout } from './components/main-layout/main-layout';
import { VueSatellite } from './components/vue-satellite/vue-satellite';
import { authGuard } from './core/guards/auth.guards';
import { FermesComponent } from './components/fermes/ferme';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'farmers',   component: FarmersComponent },    // ← corrigé
      { path: 'parcelles', component: ParcellesComponent },  // ← ajouté
      { path: 'fermes', component: FermesComponent },
      { path: 'vue-satellite', component: VueSatellite},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];