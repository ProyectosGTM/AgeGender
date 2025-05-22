import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layouts/layout.component';
const routes: Routes = [
  // 👇 Redirecciona desde raíz al módulo age-agender (dentro de pages)
  { path: '', redirectTo: 'age-agender', pathMatch: 'full' },

  { path: 'account', loadChildren: () => import('./account/account.module').then(m => m.AccountModule) },

  {
  path: '',
  component: LayoutComponent,
  loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule)
},


  {
    path: 'pages',
    loadChildren: () => import('./extrapages/extrapages.module').then(m => m.ExtrapagesModule),
    canActivate: [AuthGuard]
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
