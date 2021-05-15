import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LaunchComponent } from './smart/launch/launch.component';

const routes: Routes = [
  { path: 'prescribe', loadChildren: () => import('./prescription/prescription.module').then(m => m.PrescriptionModule) },
  { path: 'launch', component: LaunchComponent },
  { path: '', redirectTo: 'prescribe', pathMatch: 'full' },
  { path: '**', redirectTo: 'prescribe' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
