import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LaunchComponent } from './smart/launch/launch.component';

const routes: Routes = [
  { path: 'prescription', loadChildren: () => import('./prescription/prescription.module').then(m => m.PrescriptionModule) },
  { path: 'prescription/launch', component: LaunchComponent },
  { path: 'formulary', loadChildren: () => import('./formulary/formulary.module').then(m => m.FormularyModule) },
  { path: 'formulary/launch', component: LaunchComponent },
  { path: '', redirectTo: 'prescription', pathMatch: 'full' },
  { path: '**', redirectTo: 'prescription' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
