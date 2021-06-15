import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DispenseComponent } from './dispense.component';

const routes: Routes = [
  { path: '', component: DispenseComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DispenseRoutingModule { }
