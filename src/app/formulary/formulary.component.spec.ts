import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularyComponent } from './formulary.component';

describe('FormularyComponent', () => {
  let component: FormularyComponent;
  let fixture: ComponentFixture<FormularyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormularyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormularyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
