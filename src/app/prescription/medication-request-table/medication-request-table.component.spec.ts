import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationRequestTableComponent } from './medication-request-table.component';

describe('MedicationrequestTableComponent', () => {
  let component: MedicationRequestTableComponent;
  let fixture: ComponentFixture<MedicationRequestTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedicationRequestTableComponent ]
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
