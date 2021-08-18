import { AbstractControl, ValidatorFn } from '@angular/forms';
import {Coding, Ratio} from '../hl7/4.0.1/fhir.types';

export class FhirFormValidator {

  public static codingSelected(mySet: Set<Coding>): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      const selectedValue = c.value;
      if (selectedValue == null || '' === selectedValue) {
        return null;
      }
      const pickedOrNot = Array.from(mySet).filter(
        (alias) => alias.code === selectedValue.code
      );
      if (pickedOrNot.length > 0) {
        // everything's fine. return no error. therefore it's null.
        return null;
      }
      else {
        // there's no matching selectedvalue selected. so return match error.
        return { match: true };
      }
    };
  }

  public static ratioSelected(mySet: Set<Ratio>): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      const selectedValue = c.value;
      if (selectedValue == null || '' === selectedValue) {
        return null;
      }
      const pickedOrNot = Array.from(mySet).filter(
        (alias) => alias.numerator.code === selectedValue.numerator.code
      );
      if (pickedOrNot.length > 0) {
        // everything's fine. return no error. therefore it's null.
        return null;
      }
      else {
        // there's no matching selectedvalue selected. so return match error.
        return { match: true };
      }
    };
  }
}
