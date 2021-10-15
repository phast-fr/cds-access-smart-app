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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
