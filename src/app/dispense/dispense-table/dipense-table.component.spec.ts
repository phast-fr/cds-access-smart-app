import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispenseTableComponent } from './dispense-table.component';

describe('FormularyTableComponent', () => {
  let component: DispenseTableComponent;
  let fixture: ComponentFixture<DispenseTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DispenseTableComponent ]
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
