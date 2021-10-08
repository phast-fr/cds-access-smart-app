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

import { DispenseComponent } from './dispense.component';
import {MatDialogModule} from '@angular/material/dialog';
import {FormBuilder} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {StateService} from '../common/cds-access/services/state.service';
import {FhirSmartService} from '../common/fhir/smart/services/fhir.smart.service';
import {FhirClientService} from '../common/fhir/services/fhir.client.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {FhirDataSourceService} from '../common/fhir/services/fhir.data-source.service';
import {PhastCioDcService} from '../common/cds-access/services/phast.cio.dc.service';

describe('DispenseComponent', () => {
  let component: DispenseComponent;
  let fixture: ComponentFixture<DispenseComponent>;
  let activatedServiceStub: Partial<ActivatedRoute>;

  beforeEach(async () => {
    activatedServiceStub = {
      queryParams: of({code: '', state: ''})
    };

    await TestBed.configureTestingModule({
      declarations: [ DispenseComponent ],
      imports: [
        MatDialogModule
      ],
      providers: [
        FormBuilder,
        {provide: ActivatedRoute, useValue: activatedServiceStub},
        StateService,
        FhirDataSourceService,
        PhastCioDcService,
        FhirSmartService,
        FhirClientService,
        HttpClient,
        HttpHandler
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DispenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
