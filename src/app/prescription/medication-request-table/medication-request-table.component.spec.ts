import { ComponentFixture, TestBed } from '@angular/core/testing';

import {HttpClient, HttpHandler} from '@angular/common/http';
import {PrescriptionModule} from '../prescription.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MedicationRequestTableComponent } from './medication-request-table.component';

describe('MedicationRequestTableComponent', () => {
  let component: MedicationRequestTableComponent;
  let fixture: ComponentFixture<MedicationRequestTableComponent>;

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
    fixture = TestBed.createComponent(MedicationRequestTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
