import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {of} from 'rxjs';

import {PrescriptionStateService} from './prescription-state.service';
import {FhirSmartService} from '../common/fhir/smart/services/fhir.smart.service';
import {StateService} from '../common/cds-access/services/state.service';
import {FhirClientService} from '../common/fhir/services/fhir.client.service';
import {FhirDataSourceService} from '../common/fhir/services/fhir.data-source.service';
import {FhirCdsHooksService} from '../common/fhir/cds-hooks/services/fhir.cdshooks.service';

import {PrescriptionComponent} from './prescription.component';

describe('PrescriptionComponent', () => {
  let component: PrescriptionComponent;
  let fixture: ComponentFixture<PrescriptionComponent>;
  let activatedServiceStub: Partial<ActivatedRoute>;

  beforeEach(async () => {
    activatedServiceStub = {
      queryParams: of({code: '', state: ''})
    };

    await TestBed.configureTestingModule({
      declarations: [
        PrescriptionComponent
      ],
      providers: [
        PrescriptionStateService,
        {provide: ActivatedRoute, useValue: activatedServiceStub},
        HttpClient,
        HttpHandler,
        FhirSmartService,
        StateService,
        FhirClientService,
        FhirDataSourceService,
        FhirCdsHooksService
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
