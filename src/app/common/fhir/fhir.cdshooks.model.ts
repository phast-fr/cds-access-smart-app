import { fhir } from './fhir.types';

export interface Services {
  services: Array<Service>;
}

export interface Service {
  id: string;
  hook: string;
  name: string;
  title?: string;
  description?: string;
  prefetch?: object;
}

export class Hook {
  hook: string;
  hookInstance: string;
  fhirServer?: string;
  fhirAuthorization?: Authorization;
  prefetch: object;
}

export class Authorization {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  subject: string;
}

export class HookContext {
  userId: string;
  patientId: string;
  encounterId?: string;
}

/**
 * Hook: order-select
 * specificationVersion	1.0
 * hookVersion	1.0
 * hookMaturity	1 - Submitted
 * standardsStatus	draft
 * publicationStatus	snapshot
 */
export class OrderSelectHook extends Hook {
  hook: 'order-select';
  context: OrderSelectContext;
}

export class OrderSelectContext extends HookContext {
  selections: Array<string>;
  draftOrders: fhir.Bundle;
}

export class CdsCards {
  cards: Array<Card>;
}

export class Card {
  uuid?: string;
  summary: string;
  detail: string;
  indicator: IndicatorCode;
  source: Source;
  suggestions?: Array<Suggestion>;
  selectionBehavior?: string;
  overrideReasons?: Array<fhir.Coding>;
  links?: Array<Link>;
}

export class Source {
  label: string;
  url?: URL;
  icon?: URL;
  topic?: fhir.Coding;
}

export class Suggestion {
  label: string;
  uuid?: string;
  isRecommended?: boolean;
  actions: Array<Action>;
}

export class Link {
  label: string;
  url: URL;
  type: string;
  appContext?: string;
}

export class Action {
  type: string;
  description: string;
  resource: fhir.Resource;
}

enum IndicatorCode {
  INFO = 'info',
  WARN = 'warn',
  CRITICAL = 'critical',
  HARD_STOP= 'hard-stop'
}
