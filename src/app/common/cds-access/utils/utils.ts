/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */

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

  public static now(): string {
    const now = new Date();
    return now.getUTCFullYear() +
      '-' + Utils.pad( now.getUTCMonth() + 1 ) +
      '-' + Utils.pad( now.getUTCDate() );
  }

  public static adaptUnitsOfTime(code: string): string {
    let unit;
    switch (code) {
      case 'a':
        unit = 'y';
        break;
      case 'wk':
        unit = 'w';
        break;
      case 'mo':
        unit = 'M';
        break;
      case 'min':
        unit = 'm';
        break;
      default:
        unit = code;
        break;
    }
    return unit;
  }

  private static pad(num: number): string {
    if (num < 10) {
      return '0' + num;
    }
    return num.toString();
  }
}
