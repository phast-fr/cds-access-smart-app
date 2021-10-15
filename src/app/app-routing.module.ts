/*
 * MIT License
 *
 * Copyright (c) 2021 PHAST
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
