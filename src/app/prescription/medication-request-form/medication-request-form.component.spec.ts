import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationRequestFormComponent } from './medication-request-form.component';

describe('MedicationRequestFormComponent', () => {
  let component: MedicationRequestFormComponent;
  let fixture: ComponentFixture<MedicationRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedicationRequestFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicationRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
