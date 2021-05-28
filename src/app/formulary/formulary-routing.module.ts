import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormularyComponent } from './formulary.component';

const routes: Routes = [
  { path: '', component: FormularyComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FormularyRoutingModule { }
