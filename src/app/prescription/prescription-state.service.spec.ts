import { TestBed } from '@angular/core/testing';

import { PrescriptionStateService } from './prescription-state.service';

describe('PrescriptionStateService', () => {
  let service: PrescriptionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrescriptionStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
