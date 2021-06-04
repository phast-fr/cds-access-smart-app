import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularyTableComponent } from './formulary-table.component';

describe('FormularyTableComponent', () => {
  let component: FormularyTableComponent;
  let fixture: ComponentFixture<FormularyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormularyTableComponent ]
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
