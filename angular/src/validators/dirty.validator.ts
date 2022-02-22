import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { requiredIf } from "./requiredIf.validator";

/**
 * A higher order function that takes a ValidatorFn and returns a new validator.
 * The new validator only runs the ValidatorFn if the control is dirty. This prevents error messages from being
 * displayed to the user prematurely.
 */
function dirtyValidator(validator: ValidatorFn) {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.dirty ? validator(control) : null;
  };
}

export function dirtyRequiredIf(predicate: (predicateCtrl: AbstractControl) => boolean) {
  return dirtyValidator(requiredIf(predicate));
}

/**
 * Equivalent to dirtyValidator(Validator.required), however using dirtyValidator returns a new function
 * each time which prevents formControl.hasError from properly comparing functions for equality.
 */
export function dirtyRequired(control: AbstractControl): ValidationErrors | null {
  return control.dirty ? Validators.required(control) : null;
}

