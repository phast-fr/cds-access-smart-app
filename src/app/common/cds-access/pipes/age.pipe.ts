/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import { Pipe, PipeTransform } from '@angular/core';
import {DateTime} from 'luxon';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {

  transform(birth: string): string {
    const today = DateTime.now();
    const birthdate = DateTime.fromISO(birth);
    const duration = today.diff(birthdate, ['years', 'months', 'days', 'hours']);

    let html: string = duration.years + ' a ';
    html += duration.months + ' m ';
    html += duration.days + ' j';
    return html;
  }
}
