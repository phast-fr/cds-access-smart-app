import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispenseTableComponent } from './dispense-table.component';
import {FhirDataSourceService} from '../../common/fhir/services/fhir.data-source.service';
import {FhirSmartService} from '../../common/fhir/smart/services/fhir.smart.service';
import {FhirClientService} from '../../common/fhir/services/fhir.client.service';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {StateService} from '../../common/cds-access/services/state.service';
import {PhastCioDcService} from '../../common/cds-access/services/phast.cio.dc.service';

describe('DispenseTableComponent', () => {
  let component: DispenseTableComponent;
  let fixture: ComponentFixture<DispenseTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DispenseTableComponent ],
      providers: [
        StateService,
        PhastCioDcService,
        FhirDataSourceService,
        FhirSmartService,
        FhirClientService,
        HttpClient,
        HttpHandler
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DispenseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
