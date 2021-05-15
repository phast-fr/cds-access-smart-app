import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrescriptionComponent } from './prescription.component';

const routes: Routes = [
  { path: '', component: PrescriptionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrescriptionRoutingModule { }
