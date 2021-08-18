import {TestBed} from '@angular/core/testing';

import {HttpHeaders} from '@angular/common/http';
import {FhirModule} from '../fhir.module';
import {FhirClientService, Options} from '../services/fhir.client.service';
import {Patient} from '../hl7/4.0.1/fhir.types';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import Expected = jasmine.Expected;

/*describe('fhir.client.service', () => {
  let client: FhirClientService;
  const options = {
    headers: new HttpHeaders()
      .set('Accept', 'application/json; charset=utf-8; q=1')
      .set('Content-type', 'application/fhir+json')
  } as Options;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FhirModule,
        HttpClientTestingModule
      ],
    })
      .compileComponents();

    client = TestBed.inject(FhirClientService);
  });

  it('should read patient resource', async () => {
    let patient: Patient;
    await client.read<Patient>(
      '',
      {resourceType: 'Patient', id: '1'},
      options
    )
      .pipe()
      .subscribe({
        next: _patient => patient = _patient,
        error: err => console.error('error:', err)
      });
    expect<Patient>(patient).toEqual({resourceType: 'Patient', id: '1'} as Expected<Patient>);
  });
});*/
