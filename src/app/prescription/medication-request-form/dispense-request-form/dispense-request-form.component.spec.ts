import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispenseRequestFormComponent } from './dispense-request-form.component';

describe('DispenseRequestFormComponent', () => {
  let component: DispenseRequestFormComponent;
  let fixture: ComponentFixture<DispenseRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DispenseRequestFormComponent ]
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
