import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SmartLaunchComponent } from './common/fhir/smart/components/launch/smart.launch.component';

const routes: Routes = [
  { path: 'prescription', loadChildren: () => import('./prescription/prescription.module').then(m => m.PrescriptionModule) },
  { path: 'prescription/launch', component: SmartLaunchComponent },
  { path: 'formulary', loadChildren: () => import('./formulary/formulary.module').then(m => m.FormularyModule) },
  { path: 'formulary/launch', component: SmartLaunchComponent },
  { path: 'dispense', loadChildren: () => import('./dispense/dispense.module').then(m => m.DispenseModule) },
  { path: 'dispense/launch', component: SmartLaunchComponent },
  { path: 'cql-editor', loadChildren: () => import('./cql-editor/cql-editor.module').then(m => m.CqlEditorModule) },
  { path: 'cql-editor/launch', component: SmartLaunchComponent },
  { path: '', redirectTo: 'prescription', pathMatch: 'full' },
  { path: '**', redirectTo: 'prescription' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
