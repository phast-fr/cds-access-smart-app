/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

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
    // TODO use https://github.com/moment/luxon/
    const today = moment();
    const birthdate = moment(birth);
    const duration = moment.duration(today.diff(birthdate));

    let html: string = duration.years() + ' a ';
    html += duration.months() + ' m ';
    html += duration.days() + ' j';
    return html;
  }

  /*transform(birth: string): string {
    const today = Temporal.now.instant();
    const birthdate = Temporal.Instant.from(new Date(birth).toISOString());
    const duration = birthdate.until(today);
    console.log(duration.toString());
    let html: string = duration.years + ' a ';
    html += duration.months + ' m ';
    html += duration.days + ' j';
    return html;
  }*/
}
