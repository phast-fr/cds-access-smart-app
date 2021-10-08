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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import {HttpClient, HttpHandler} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PrescriptionModule} from '../prescription.module';
import { MedicationRequestFormComponent } from './medication-request-form.component';

describe('MedicationRequestFormComponent', () => {
  let component: MedicationRequestFormComponent;
  let fixture: ComponentFixture<MedicationRequestFormComponent>;
  // let scheduler: TestScheduler;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        PrescriptionModule
      ],
      providers: [
        HttpClient,
        HttpHandler
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicationRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    /*scheduler = new TestScheduler((actual, expected) => {
      expected(actual).toEqual(expected);
    });*/
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /*it('should add medication', () => {
    const medicationKnowledge = {} as MedicationKnowledge;
    const medicationId = component.viewModel.nextMedicationId();
    const patient = {} as Patient;
    const practitioner = {} as Practitioner;

    scheduler.run(({expectObservable}) => {
      const expectedMarble = '';
      const expectedObj = {};
      expectObservable(component.viewModel.state$()).toBe(expectedMarble, expectedObj);
    });

    component.viewModel.dispatchIntent(
      new MedicationFormIntentAddMedication(
        component.viewModel.medicationRequest, medicationKnowledge, medicationId, patient, practitioner
      )
    );
  });*/
});
