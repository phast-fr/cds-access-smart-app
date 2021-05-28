import { Card } from '../common/fhir/fhir.cdshooks.model';

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
