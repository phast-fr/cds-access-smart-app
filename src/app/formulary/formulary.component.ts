import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormControl} from '@angular/forms';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {StateService} from '../common/cds-access/services/state.service';
import {FhirSmartService} from '../common/fhir/smart/services/fhir.smart.service';
import {FormularyStateService} from './formulary-state.service';
import {FhirDataSourceService} from '../common/fhir/services/fhir.data-source.service';
import {PhastCioDcService} from '../common/cds-access/services/phast.cio.dc.service';
import {SmartComponent, StateModel} from '../common/cds-access/models/core.model';
import {FhirTypeGuard} from '../common/fhir/utils/fhir.type.guard';
import {FhirLabelProviderFactory} from '../common/fhir/providers/fhir.label.provider.factory';
import {Bundle, Composition, Practitioner} from 'phast-fhir-ts';

const MEDICINES_ICON = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M14.8106 10.013C14.8091 10.0148 14.8061 10.0186 14.8021 10.0252L8.01 21.1404C8.01052 21.1408 8.01104 21.1411 8.01156 21.1415C8.01351 21.1428 8.01659 21.1445 8.02192 21.1463C8.02695 21.1481 8.03827 21.1513 8.05824 21.1527L19.9246 21.9994C19.9446 22.0009 19.9568 21.9993 19.963 21.9981C19.9696 21.9969 19.9742 21.9952 19.9779 21.9934C19.9827 21.9912 19.9875 21.988 19.9918 21.9841L14.9361 10.0239C14.9342 10.0194 14.9326 10.0164 14.9316 10.0145C14.9257 10.0111 14.9077 10.0026 14.8779 10.0004C14.8449 9.99809 14.8228 10.0054 14.8156 10.0089L14.8132 10.0103C14.8131 10.0103 14.8121 10.0112 14.8106 10.013ZM16.7782 9.24516C16.1307 7.71335 13.9653 7.55884 13.0955 8.98238L6.29281 20.1148C5.50809 21.399 6.38547 23.0385 7.9159 23.1477L19.7823 23.9944C21.3127 24.1036 22.4261 22.6062 21.842 21.2243L16.7782 9.24516Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M34 20C37.3137 20 40 17.3137 40 14C40 10.6863 37.3137 8 34 8C30.6863 8 28 10.6863 28 14C28 17.3137 30.6863 20 34 20ZM34 22C38.4183 22 42 18.4183 42 14C42 9.58172 38.4183 6 34 6C29.5817 6 26 9.58172 26 14C26 18.4183 29.5817 22 34 22Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M38.2823 14.9846C38.1586 15.5229 37.6219 15.8589 37.0837 15.7351L30.468 14.2142C29.9298 14.0905 29.5938 13.5538 29.7175 13.0156C29.8413 12.4773 30.3779 12.1413 30.9161 12.2651L37.5318 13.786C38.07 13.9097 38.4061 14.4464 38.2823 14.9846Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M31.1587 27.2961L20.283 32.3675C18.2808 33.3012 17.4146 35.6811 18.3482 37.6832C19.2819 39.6854 21.6618 40.5516 23.664 39.618L34.5396 34.5466C36.5418 33.613 37.408 31.233 36.4744 29.2309C35.5408 27.2287 33.1609 26.3625 31.1587 27.2961ZM19.4378 30.5549C16.4345 31.9554 15.1352 35.5252 16.5356 38.5285C17.9361 41.5317 21.5059 42.8311 24.5092 41.4306L35.3849 36.3592C38.3881 34.9588 39.6875 31.3889 38.287 28.3856C36.8866 25.3824 33.3167 24.0831 30.3135 25.4835L19.4378 30.5549Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M24.7494 30.2858L20.283 32.3675C18.2808 33.3012 17.4146 35.6811 18.3482 37.6832C19.2819 39.6854 21.6618 40.5516 23.664 39.618L28.1304 37.5362L24.7494 30.2858ZM25.7168 27.6279L30.7882 38.5036L24.5092 41.4306C21.5059 42.8311 17.9361 41.5317 16.5356 38.5285C15.1352 35.5252 16.4345 31.9554 19.4378 30.5549L25.7168 27.6279Z" fill="#333333"/>' +
  '</svg>';

@Component({
  selector: 'app-formulary',
  templateUrl: './formulary.component.html',
  styleUrls: ['./formulary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormularyComponent extends SmartComponent implements OnDestroy, AfterViewInit  {

  private readonly _loading$: BehaviorSubject<boolean>;

  private readonly _searching$: BehaviorSubject<boolean>;

  private readonly _compositionControl: FormControl;

  private readonly _compositionArray: Array<Composition>;

  private _user?: Practitioner;

  private _composition?: Composition;

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              route: ActivatedRoute,
              smartService: FhirSmartService,
              private _fb: FormBuilder,
              private _stateService: StateService,
              private _formularyState: FormularyStateService,
              private _labelProviderFactory: FhirLabelProviderFactory,
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: PhastCioDcService) {
    super(route, smartService);
    this._iconRegistry.addSvgIconLiteral('medicines', this._sanitizer.bypassSecurityTrustHtml(MEDICINES_ICON));
    this._compositionControl = this._fb.control(null);
    this._compositionArray = new Array<Composition>();
    this._loading$ = new BehaviorSubject<boolean>(true);
    this._searching$ = new BehaviorSubject<boolean>(false);
    this._stateService.state$
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        filter(state => state !== false),
        map(state => state as StateModel),
      )
      .subscribe({
        next: state => {
          this._user = state.practitioner;
          this._loading$.next(false);
        },
        error: err => console.error(err)
      });
  }

  public get isSearching$(): Observable<boolean> {
    return this._searching$.asObservable();
  }

  public get loading$(): Observable<boolean> {
    return this._loading$;
  }

  public get compositionControl(): FormControl {
    return this._compositionControl;
  }

  public get compositionArray(): Array<Composition> {
    return this._compositionArray;
  }

  public ngAfterViewInit(): void {
    const compositionString$ = this._compositionControl.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const compositionObj$ = this._compositionControl.valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    compositionString$
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(
          () => {
            this._compositionArray.length = 0;
            this._searching$.next(true);
          }),
        switchMap(value => this._cioDcSource.searchComposition(value)
          .pipe(
            tap(() => this._searching$.next(false))
          )
        ),
        filter(result => FhirTypeGuard.isBundle(result)),
        map(result => result as Bundle),
        filter(bundle => !!bundle.total && bundle.total > 0)
      )
      .subscribe({
        next: bundle => {
          if (bundle.entry) {
            bundle.entry.forEach(entry => {
              if (FhirTypeGuard.isComposition(entry.resource)) {
                this._compositionArray.push(entry.resource);
              }
            });
          }
        },
        error: err => console.error('error', err)
      });
    compositionObj$
      .pipe(
        switchMap(composition => this._cioDcSource.readCompositionMedicationKnowledge(composition.id))
      )
      .subscribe({
        next: composition => {
          this._composition = composition;
          this._formularyState.changeComposition = this._composition;
        },
        error: err => console.error('error', err)
      });
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this._loading$.complete();
  }

  public trackBy(_: number, composition: Composition): string | undefined {
    return composition.id;
  }

  public displayFn(composition: Composition): string | undefined {
    return this._labelProviderFactory.getProvider(composition)?.getText(composition);
  }
}
