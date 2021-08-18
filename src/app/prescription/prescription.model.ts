import { Card } from '../common/fhir/cds-hooks/models/fhir.cdshooks.model';

export interface Readable {
  isReaded: boolean;
}

export class CardReadable implements Readable {

  isReaded = false;

  constructor(private card: Card) { }

  public getCard(): Card {
    return this.card;
  }
}
