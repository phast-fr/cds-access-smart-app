import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularyComponent } from './formulary.component';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {FhirSmartService} from '../common/fhir/smart/services/fhir.smart.service';
import {StateService} from '../common/cds-access/services/state.service';
import {FhirClientService} from '../common/fhir/services/fhir.client.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {FormBuilder} from '@angular/forms';
import {FormularyStateService} from './formulary-state.service';
import {FhirDataSourceService} from '../common/fhir/services/fhir.data-source.service';
import {PhastCioDcService} from '../common/cds-access/services/phast.cio.dc.service';

describe('FormularyComponent', () => {
  let component: FormularyComponent;
  let fixture: ComponentFixture<FormularyComponent>;
  let activatedServiceStub: Partial<ActivatedRoute>;

  beforeEach(async () => {
    activatedServiceStub = {
      queryParams: of({code: '', state: ''})
    };

    await TestBed.configureTestingModule({
      declarations: [ FormularyComponent ],
      providers: [
        {provide: ActivatedRoute, useValue: activatedServiceStub},
        FhirSmartService,
        StateService,
        FhirClientService,
        HttpClient,
        HttpHandler,
        FormBuilder,
        FormularyStateService,
        FhirDataSourceService,
        PhastCioDcService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormularyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
