import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DosageInstructionFormComponent } from './dosage-instruction-form.component';

describe('DosageInstructionFormComponent', () => {
  let component: DosageInstructionFormComponent;
  let fixture: ComponentFixture<DosageInstructionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DosageInstructionFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DosageInstructionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
