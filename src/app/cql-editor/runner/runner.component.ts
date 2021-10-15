/*
 * MIT License
 *
 * Copyright (c) 2021 PHAST
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {Component, ViewChildren, QueryList, OnDestroy, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';

import {Editor} from 'codemirror';
import {Base64} from 'js-base64';
import {Library} from 'phast-fhir-ts';

import {StateService} from '../../common/cds-access/services/state.service';
import {StateModel} from '../../common/cds-access/models/core.model';
import {IRender} from '../../common/cds-access/models/state.model';
import {CodeMirrorDirective} from '../shared/code-mirror/code-mirror.directive';
import {EditorType} from '../shared/code-mirror/code-mirror.type';

import {CqlEditorViewModel} from '../cql-editor.view-model';
import {CqlEditorState} from '../cql-editor.state';
import {CqlEditorIntentOnChangeContentLibrary, CqlEditorIntentOnRunLibrary} from '../cql-editor.intent';

@Component ({
  selector: 'app-runner',
  templateUrl: './runner.component.html',
  styleUrls: ['./runner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunnerComponent implements OnInit, OnDestroy, IRender<CqlEditorState> {

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _running$: BehaviorSubject<boolean>;

  readonly defaultContent = '// See results here';

  editorType = EditorType;

  @ViewChildren(CodeMirrorDirective)
  codeEditors?: QueryList<CodeMirrorDirective>;

  constructor(private _stateService: StateService,
              private _viewModel: CqlEditorViewModel) {
    this._unsubscribeTrigger$ = new Subject<void>();
    this._running$ = new BehaviorSubject<boolean>(false);
  }

  public get running$(): Observable<boolean> {
    return this._running$.asObservable();
  }

  public ngOnInit(): void {
    this._viewModel.state$()
        .pipe(
            takeUntil(this._unsubscribeTrigger$),
            filter(state => state !== null)
        )
        .subscribe({
          next: state => this.render(state),
          error: err => console.error('error', err)
        });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();

    const inputEditor = this.getInputEditor();
    if (inputEditor?.editor) {
      inputEditor.editor.off('change', this.onChangeContentLibrary);
    }
  }

  public render(state: CqlEditorState): void {
    switch (state.type) {
      case 'OnChangeLibrary':
        if (state.library) {
          this.displayInputContent(state.library);
        }
        this.displayOutputDefault();
        break;
      case 'OnRunLibrary':
        this._running$.next(state.isRunning);
        if (state.oValue) {
          this.updateOutput(state.oValue);
        }
        break;
    }
  }

  public run(): void {
    this.clearOutput();
    if (!this._running$.value) {
      this._running$.next(true);

      if (this._stateService.state) {
        const stateModel = this._stateService.state as StateModel;
        const inputEditor = this.getInputEditor();
        if (stateModel.context
            && stateModel.patient
            && inputEditor?.value) {
          this._viewModel.dispatchIntent(
              new CqlEditorIntentOnRunLibrary(
                  stateModel.context,
                  stateModel.patient,
                  inputEditor.value
              )
          );
        }
      }
    }
  }

  public clearOutput(): void {
    const output = this.getOutputEditor();
    if (output) {
      output.value = '';
    }
  }

  private getInputEditor(): CodeMirrorDirective | undefined {
    if (this.codeEditors) {
      return this.codeEditors.find((mirror: CodeMirrorDirective) => mirror.type === EditorType.input);
    }
    return undefined;
  }

  private getOutputEditor(): CodeMirrorDirective | undefined {
    if (this.codeEditors) {
      return this.codeEditors.find((mirror: CodeMirrorDirective) => mirror.type === EditorType.output);
    }
    return undefined;
  }

  private displayInputContent(library: Library): void {
    const inputEditor = this.getInputEditor();
    if (inputEditor?.editor) {
      inputEditor.editor.off('change', this.onChangeContentLibrary);
      if (library.content && library.content[0]?.data) {
        inputEditor.value = Base64.decode(library.content[0].data);
      }
      else {
        inputEditor.value = '';
      }
      inputEditor.editor.on('change', this.onChangeContentLibrary.bind(this));
    }
  }

  private displayOutputDefault(): void {
    const output = this.getOutputEditor();
    if (output) {
      output.value = this.defaultContent;
    }
  }

  private updateOutput(oValue: string): void {
    const output = this.getOutputEditor();
    if (output) {
      output.value = oValue;
    }
  }

  private onChangeContentLibrary(instance: Editor, _: any): void {
    const value = instance.getValue();
    if (this._viewModel.library) {
      this._viewModel.dispatchIntent(
          new CqlEditorIntentOnChangeContentLibrary(
              this._viewModel.library,
              value
          )
      );
    }
  }
}
