import { ComponentFixture, TestBed } from '@angular/core/testing';

import {HttpClient, HttpHandler} from '@angular/common/http';
import {PrescriptionModule} from '../../prescription.module';
import { DispenseRequestFormComponent } from './dispense-request-form.component';

describe('DispenseRequestFormComponent', () => {
  let component: DispenseRequestFormComponent;
  let fixture: ComponentFixture<DispenseRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
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
    fixture = TestBed.createComponent(DispenseRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
