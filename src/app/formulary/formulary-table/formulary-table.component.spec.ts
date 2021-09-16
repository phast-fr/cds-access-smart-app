import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularyTableComponent } from './formulary-table.component';
import {FhirDataSourceService} from '../../common/fhir/services/fhir.data-source.service';
import {FormularyStateService} from '../formulary-state.service';
import {FhirSmartService} from '../../common/fhir/smart/services/fhir.smart.service';
import {StateService} from '../../common/cds-access/services/state.service';
import {FhirClientService} from '../../common/fhir/services/fhir.client.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {PhastCioDcService} from '../../common/cds-access/services/phast.cio.dc.service';

describe('FormularyTableComponent', () => {
  let component: FormularyTableComponent;
  let fixture: ComponentFixture<FormularyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormularyTableComponent ],
      providers: [
        FormularyStateService,
        FhirSmartService,
        StateService,
        FhirClientService,
        FhirDataSourceService,
        HttpClient,
        HttpHandler,
        PhastCioDcService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormularyTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
