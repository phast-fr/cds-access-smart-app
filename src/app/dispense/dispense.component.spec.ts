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
