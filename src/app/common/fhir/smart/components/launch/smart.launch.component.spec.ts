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
