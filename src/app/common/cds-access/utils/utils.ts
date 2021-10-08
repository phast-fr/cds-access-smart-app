/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {Duration} from 'luxon';
/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
export class Utils {

  /**
   * Decodes a JWT token and returns it's body.
   * @param tokenId The token to read
   * @category Utility
   */
  public static jwtDecode(tokenId: string): object {
    const payload = tokenId.split('.')[1];
    return JSON.parse(atob(payload));
  }

  public static duration(value: number, unitCode: string): Duration | undefined {
    switch (unitCode) {
      case 'a':
        return Duration.fromObject({years: value});
      case 'mo':
        return Duration.fromObject({months: value});
      case 'wk':
        return Duration.fromObject({weeks: value});
      case 'd':
        return Duration.fromObject({days: value});
      case 'h':
        return Duration.fromObject({hours: value});
      case 'min':
        return Duration.fromObject({minutes: value});
      case 's':
        return Duration.fromObject({seconds: value});
    }
    return undefined;
  }

  public static intersect<T>(firstArray: Array<T>, arrays: Array<Array<T>>,
                             comparator: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => boolean): Array<T> {
    const intersect = (a: Array<T>, b: Array<T>) => {
      return [...a].filter((x, index, array) => b.some(y => comparator(x, y, index, array)));
    };

    // iterate all sets comparing the first set to each.
    arrays.forEach(sItem => firstArray = intersect(firstArray, sItem));

    // return the result.
    return firstArray;
  }
}
