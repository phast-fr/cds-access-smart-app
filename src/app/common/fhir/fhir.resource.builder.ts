import { fhir } from './fhir.types';
import MedicationRequest = fhir.MedicationRequest;
import Resource = fhir.Resource;
import Reference = fhir.Reference;
import MedicationRequestIntent = fhir.MedicationRequestIntent;
import Dosage = fhir.Dosage;

export class MedicationRequestBuilder {

  private readonly _resource: MedicationRequest;

  constructor(intent: MedicationRequestIntent, subject: Reference) {
    this._resource = {
      resourceType: 'MedicationRequest',
      contained: new Array<Resource>(),
      intent,
      subject,
      dosageInstruction: new Array<Dosage>(),
      dispenseRequest: {
        validityPeriod: {
          start: undefined,
          end: undefined
        },
        expectedSupplyDuration: {
          value: undefined,
          unit: undefined,
          system: undefined,
          code: undefined
        }
      }
    };
  }

  public intent(intent: MedicationRequestIntent): MedicationRequestBuilder {
    this._resource.intent = intent;
    return this;
  }

  public subject(subject: Reference): MedicationRequestBuilder {
    this._resource.subject = subject;
    return this;
  }

  public build(): MedicationRequest {
    return this._resource;
  }
}
