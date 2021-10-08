import {Bundle, Coding, Resource} from 'phast-fhir-ts';

export interface Services {
  services: Array<Service>;
}

export interface Service {
  id: string;
  hook: string;
  name: string;
  title?: string;
  description?: string;
  prefetch: { [s: string]: string; };
}

export class Hook {
  hook: string;
  hookInstance: string;
  fhirServer?: string;
  fhirAuthorization?: Authorization;
  prefetch: { [s: string]: Resource; };

  constructor(hook: string, hookInstance: string, prefetch: { [s: string]: Resource; }) {
    this.hook = hook;
    this.hookInstance = hookInstance;
    this.prefetch = prefetch;
  }
}

export class Authorization {
  'access_token': string;
  'token_type': string;
  'expires_in': number;
  scope: string;
  subject: string;

  constructor(scope: string, subject: string) {
    this.scope = scope;
    this.subject = subject;
  }
}

export class HookContext {
  userId: string;
  patientId: string;
  encounterId?: string;

  constructor(userId: string, patientId: string) {
    this.userId = userId;
    this.patientId = patientId;
  }
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
  context: OrderSelectContext;

  constructor(hookInstance: string, prefetch: { [s: string]: Resource; }, context: OrderSelectContext) {
    super('order-select', hookInstance, prefetch);
    this.context = context;
  }
}

export class OrderSelectContext extends HookContext {
  selections: Array<string>;
  draftOrders: Bundle;

  constructor(userId: string, patientId: string, selections: Array<string>, draftOrders: Bundle) {
    super(userId, patientId);
    this.selections = selections;
    this.draftOrders = draftOrders;
  }
}

export class CdsCards {
  cards: Array<Card>;

  constructor(cards: Array<Card>) {
    this.cards = cards;
  }
}

export class Card {
  uuid?: string;
  summary: string;
  detail: string;
  indicator: IndicatorCode;
  source: Source;
  suggestions?: Array<Suggestion>;
  selectionBehavior?: string;
  overrideReasons?: Array<Coding>;
  links?: Array<Link>;

  constructor(summary: string, detail: string, indicator: IndicatorCode, source: Source) {
    this.summary = summary;
    this.detail = detail;
    this.indicator = indicator;
    this.source = source;
  }
}

export class Source {
  label: string;
  url?: URL;
  icon?: URL;
  topic?: Coding;

  constructor(label: string) {
    this.label = label;
  }
}

export class Suggestion {
  label: string;
  uuid?: string;
  isRecommended?: boolean;
  actions: Array<Action>;

  constructor(label: string, actions: Array<Action>) {
    this.label = label;
    this.actions = actions;
  }
}

export class Link {
  label: string;
  url: URL;
  type: string;
  appContext?: string;

  constructor(label: string, url: URL, type: string) {
    this.label = label;
    this.url = url;
    this.type = type;
  }
}

export class Action {
  type: string;
  description: string;
  resource: Resource;

  constructor(type: string, description: string, resource: Resource) {
    this.type = type;
    this.description = description;
    this.resource = resource;
  }
}

enum IndicatorCode {
  INFO = 'info',
  WARN = 'warn',
  CRITICAL = 'critical',
  HARD_STOP= 'hard-stop'
}
