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
