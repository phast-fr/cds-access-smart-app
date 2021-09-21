/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {Pipe, PipeTransform} from '@angular/core';

import {I18nSelectPipe} from '@angular/common';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
@Pipe({
    name: 'myI18nSelect'
})
export class MyI18nSelectPipe extends I18nSelectPipe implements PipeTransform {

    transform(value: string | null | undefined, mapping: { [key: string]: string; }): string {
        const result = super.transform(value, mapping);
        if (!result) {
            return value;
        }
        return result;
    }
}
