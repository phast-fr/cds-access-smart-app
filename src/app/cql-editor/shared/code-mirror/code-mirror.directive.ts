// Directive responsible for CodeMirror configuration and injection

import {AfterViewInit, Directive, ElementRef, Input} from '@angular/core';
import * as CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import {EditorType} from './code-mirror.type';
import {CodeMirrorConfig, ICodeMirrorConfig} from './code-mirror.config';

@Directive ({
  selector: '[appCqlCodeMirror]'
})
export class CodeMirrorDirective implements AfterViewInit {

  private _type?: EditorType;

  private _config?: ICodeMirrorConfig;

  private _editor?: CodeMirror.EditorFromTextArea;

  constructor(private _el: ElementRef) {
  }

  set value(value: string | undefined) {
    if (this._config) {
      this._config.value = value;
    }
    if (this._editor && value) {
      this._editor.setValue(value);
    }
  }

  get value(): string | undefined {
    if (this._editor) {
      const selection = this._editor.getSelection();
      return selection.length > 0 ? selection : this._editor.getValue();
    }
    return undefined;
  }

  get editor(): CodeMirror.EditorFromTextArea | undefined {
    return this._editor;
  }

  ngAfterViewInit(): void {
    if (this._type !== undefined) {
      this._config = new CodeMirrorConfig(this._type);
    }
    this._editor = CodeMirror.fromTextArea(this._el.nativeElement, this._config);
  }

  @Input()
  set type(type: EditorType | undefined) {
    this._type = type;
  }

  get type(): EditorType | undefined {
    return this._type;
  }
}
