import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { StateService } from '../common/services/state.service';
import { SmartService } from '../smart/services/smart.service';
import { FormularyStateService } from './formulary-state.service';
import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { FhirCioDcService } from '../common/services/fhir.cio.dc.service';
import { FhirTypeGuard } from '../common/fhir/fhir.type.guard';
import { FhirLabelProviderFactory } from '../common/fhir/fhir.label.provider.factory';
import { fhir } from '../common/fhir/fhir.types';
import Bundle = fhir.Bundle;
import Composition = fhir.Composition;
import Practitioner = fhir.Practitioner;

@Component({
  selector: 'app-formulary',
  templateUrl: './formulary.component.html',
  styleUrls: ['./formulary.component.css']
})
export class FormularyComponent implements OnInit, OnDestroy, AfterViewInit  {

  private _labelProviderFactory = new FhirLabelProviderFactory();

  user: Practitioner;

  composition: Composition;

  compositionControl = this._fb.control(null);

  isLoading = false;

  private _compositionArray = new Array<Composition>();

  private _unsubscribeTrigger$ = new Subject<void>();

  constructor(private _fb: FormBuilder,
              private route: ActivatedRoute,
              private stateService: StateService,
              private smartService: SmartService,
              private _formularyState: FormularyStateService,
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: FhirCioDcService) {
    this.stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(stateModel => stateModel.userType() === 'Practitioner'),
        switchMap(stateModel => this._dataSource.readPractitioner(stateModel.userId()))
      )
      .subscribe(
        (user) => this.user = user
      );
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  public get compositionArray(): Array<Composition> {
    return this._compositionArray;
  }

  ngOnInit(): void {
    const routeWithoutToken$ = this.route.queryParams
      .pipe(
        filter(_ => !this.smartService.isTokenExist())
      );
    const routeWithToken$ = this.route.queryParams
      .pipe(
        filter(_ => this.smartService.isTokenExist())
      );
    routeWithoutToken$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        map(params  => {
          return {
            code: params.code,
            state: params.state
          };
        })
      )
      .subscribe(value => this.smartService.retrieveToken(value.code, value.state));
    routeWithToken$
      .subscribe(_ => this.smartService.loadToken());
  }

  ngAfterViewInit(): void {
    const compositionString$ = this.compositionControl.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const compositionObj$ = this.compositionControl.valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    compositionString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(
          () => {
            this._compositionArray.length = 0;
            this.isLoading = true;
          }),
        switchMap(value => this._cioDcSource.searchComposition(value))
      )
      .subscribe(
        response => {
          const bundle = response as Bundle;
          if (bundle.total > 0) {
            for (const entry of bundle.entry) {
              if (FhirTypeGuard.isComposition(entry.resource)) {
                this._compositionArray.push(entry.resource);
              }
            }
          }
          this.isLoading = false;
        });
    compositionObj$
      .pipe(
        switchMap(composition => this._cioDcSource.readCompositionMedicationKnowledge(composition.id))
      )
      .subscribe((composition: Composition) => {
        this.composition = composition;
        this._formularyState.changeComposition = composition;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }

  trackByComposition(_, composition: Composition): string {
    return composition.id;
  }

  displayComposition(composition: Composition): string | null {
    if (composition == null) { return null; }
    return this._labelProviderFactory.getProvider(composition).getText(composition);
  }
}
