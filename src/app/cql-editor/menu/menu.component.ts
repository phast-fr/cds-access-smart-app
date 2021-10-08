import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, takeUntil, tap} from 'rxjs/operators';

import {Library} from 'phast-fhir-ts';

import {FhirTypeGuard} from '../../common/fhir/utils/fhir.type.guard';
import {FhirLabelProviderFactory} from '../../common/fhir/providers/fhir.label.provider.factory';
import {StateService} from '../../common/cds-access/services/state.service';
import {CqlEditorViewModel} from '../cql-editor.view-model';
import {CqlEditorIntentOnChangeLibrary, CqlEditorIntentOnSaveLibrary, CqlEditorIntentOnSearchLibrary} from '../cql-editor.intent';
import {IRender} from '../../common/cds-access/models/state.model';
import {CqlEditorState} from '../cql-editor.state';


@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit, OnDestroy, IRender<CqlEditorState> {

    private readonly _unsubscribeTrigger$: Subject<void>;

    private readonly _form: FormGroup;

    private readonly _searching$: BehaviorSubject<boolean>;

    private readonly _isDirty$: BehaviorSubject<boolean>;

    private _libraries?: Array<Library>;

    constructor(private _fb: FormBuilder,
                private _labelProviderFactory: FhirLabelProviderFactory,
                private _stateService: StateService,
                private _viewModel: CqlEditorViewModel) {
        this._unsubscribeTrigger$ = new Subject<void>();
        this._form = this._fb.group({
          library: ['', Validators.required]
        });
        this._searching$ = new BehaviorSubject<boolean>(false);
        this._isDirty$ = new BehaviorSubject<boolean>(false);
    }

    public get form(): FormGroup {
        return this._form;
    }

    public get isSearching$(): Observable<boolean> {
        return this._searching$.asObservable();
    }

    public get isDirty$(): Observable<boolean> {
        return this._isDirty$;
    }

    public get libraries(): Array<Library> | undefined {
        return this._libraries;
    }

    ngOnInit(): void {
        this._viewModel.state$()
            .pipe(
                takeUntil(this._unsubscribeTrigger$),
                filter(state => state !== null)
            )
            .subscribe({
                next: state => this.render(state),
                error: err => console.error('error', err)
            });
        this.initForm();
    }

    ngOnDestroy(): void {
        this._unsubscribeTrigger$.next();
        this._unsubscribeTrigger$.complete();

        this._searching$.complete();
    }

    public render(state: CqlEditorState): void {
        switch (state.type) {
            case 'OnChangeLibrary':
            case 'OnChangeContentLibrary':
            case 'OnSaveLibrary':
                this._isDirty$.next(state.isDirty);
                break;
            case 'OnSearchLibrary':
                this._libraries = state.libraries;
                this._searching$.next(state.isSearching);
                break;
        }
    }

    public trackByLibraries(index: number, library: Library): string | undefined {
      return library.id;
    }

    public displayFnLibrary(library: Library): string | undefined {
        return this._labelProviderFactory.getProvider(library)?.getText(library);
    }

    private initForm(): void {
        this._viewModel.searchLibraryCQL();
        this.onChangeLibrary();
    }

    public onSave(): void {
        if (this._viewModel.library) {
            this._viewModel.dispatchIntent(
                new CqlEditorIntentOnSaveLibrary(
                    this._viewModel.library
                )
            );
        }
    }

    private onChangeLibrary(): void {
        const libraryControl = this._form.get('library');
        if (libraryControl) {
            const libraryControlString$ = libraryControl.valueChanges
                .pipe(
                    debounceTime(500),
                    distinctUntilChanged(),
                    filter(value => typeof value === 'string')
                );
            libraryControlString$
                .pipe(
                    takeUntil(this._unsubscribeTrigger$),
                    tap(() => this._searching$.next(true)))
                .subscribe({
                    next: (value: string) => this._viewModel.dispatchIntent(new CqlEditorIntentOnSearchLibrary(value)),
                    error: err => console.error('error', err),
                });

            const libraryControlFhir$ = libraryControl.valueChanges
                .pipe(
                    filter(value => value instanceof Object && FhirTypeGuard.isLibrary(value))
                );
            libraryControlFhir$
                .pipe(
                    takeUntil(this._unsubscribeTrigger$)
                )
                .subscribe({
                    next: (library: Library) => this._viewModel.dispatchIntent(new CqlEditorIntentOnChangeLibrary(library)),
                    error: err => console.error('error', err)
                });
        }
    }
}
