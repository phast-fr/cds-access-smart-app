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

import { SmartLaunchComponent } from './smart.launch.component';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {FhirSmartService} from '../../services/fhir.smart.service';
import {StateService} from '../../../../cds-access/services/state.service';
import {FhirClientService} from '../../../services/fhir.client.service';
import {HttpClient, HttpHandler} from '@angular/common/http';

describe('LaunchComponent', () => {
  let component: SmartLaunchComponent;
  let fixture: ComponentFixture<SmartLaunchComponent>;
  let activatedServiceStub: Partial<ActivatedRoute>;

  beforeEach(async () => {
    activatedServiceStub = {
      queryParams: of({code: '', state: ''})
    };

    await TestBed.configureTestingModule({
      declarations: [ SmartLaunchComponent ],
      providers: [
        {provide: ActivatedRoute, useValue: activatedServiceStub},
        FhirSmartService,
        StateService,
        FhirClientService,
        HttpClient,
        HttpHandler
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartLaunchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
