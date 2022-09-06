import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { Library } from "phast-fhir-ts";
import { BehaviorSubject, filter, Observable, Subject, takeUntil } from "rxjs";
import { IRender } from "src/app/common/cds-access/models/state.model";
import { StateService } from "src/app/common/cds-access/services/state.service";
import { FhirLabelProviderFactory } from "src/app/common/fhir/providers/fhir.label.provider.factory";
import { CqlEditorActionOnChangeLibrary } from "../cql-editor.action";
import { CqlEditorIntentOnChangeLibrary, CqlEditorIntentOnSearchLibrary } from "../cql-editor.intent";
import { CqlEditorState } from "../cql-editor.state";
import { CqlEditorViewModel } from "../cql-editor.view-model";

@Component({
    selector: 'app-tableau',
    templateUrl: './tableau.component.html',
    styleUrls: ['./tableau.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableauComponent implements OnInit, OnDestroy, IRender<CqlEditorState>  {

    private readonly _unsubscribeTrigger$: Subject<void>;

    public _libraries: BehaviorSubject<Array<Library>> = new BehaviorSubject<Array<Library>>([]);

    public _count: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    public displayedColumns: string[] = ['name'];

    constructor(
        private _labelProviderFactory: FhirLabelProviderFactory,
        private _stateService: StateService,
        private _viewModel: CqlEditorViewModel) {
        this._unsubscribeTrigger$ = new Subject<void>();
    }

    pagination(event: PageEvent): void {
        this._viewModel.dispatchIntent(new CqlEditorIntentOnSearchLibrary('', 10, event.pageIndex));
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
        this._viewModel.searchLibraryCQL(undefined, 10);
        this._viewModel.dispatchIntent(new CqlEditorIntentOnSearchLibrary('', 10));
        
    }
    ngOnDestroy(): void {
        this._unsubscribeTrigger$.next();
        this._unsubscribeTrigger$.complete();
    }
    render(state: CqlEditorState): void {
        switch (state.type) {
            case 'OnChangeLibrary':
            case 'OnChangeContentLibrary':
            case 'OnSaveLibrary':
                break;
            case 'OnSearchLibrary':
                this._libraries.next(state.libraries);
                this._count.next(state.count ?? 0);
                break;
        }
    }

    public displayFnLibrary(library: Library): string | undefined {
        return this._labelProviderFactory.getProvider(library)?.getText(library);
    }

    public load(library: Library): void {
        this._viewModel.dispatchIntent(new CqlEditorIntentOnChangeLibrary(library));
    }

}