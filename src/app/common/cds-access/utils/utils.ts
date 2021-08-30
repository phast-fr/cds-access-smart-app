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
   * Generates random strings. By default this returns random 8 characters long
   * alphanumeric strings.
   * @param strLength The length of the output string. Defaults to 8.
   * @param charSet A string containing all the possible characters.
   *     Defaults to all the upper and lower-case letters plus digits.
   * @category Utility
   */
  public static randomString(
    strLength = 8,
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    const result = [];
    const len = charSet.length;
    while (strLength--) {
      result.push(charSet.charAt(Math.floor(Math.random() * len)));
    }
    return result.join('');
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
    const intersect = (a, b) => {
      return [...a].filter((x, index, array) => b.some(y => comparator(x, y, index, array)));
    };

    // iterate all sets comparing the first set to each.
    arrays.forEach(sItem => firstArray = intersect(firstArray, sItem));

    // return the result.
    return firstArray;
  }
}
