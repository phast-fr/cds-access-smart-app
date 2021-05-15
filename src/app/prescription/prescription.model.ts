import { Card } from '../common/fhir/fhir.cdshooks.model';
import { fhir } from '../common/fhir/fhir.types';

export interface Readable {
  isReaded: boolean;
}

export class CardReadable implements Readable {

  isReaded = false;

  constructor(private card: Card) { }

  getCard(): Card {
    return this.card;
  }
}

export interface Elements {
  position: number;
  resource: fhir.MedicationRequest;
}
