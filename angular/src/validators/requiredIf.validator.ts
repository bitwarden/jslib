import { AbstractControl, ValidationErrors, Validators } from "@angular/forms";

/**
 * Returns a new validator which will apply Validators.required only if the predicate is true.
 */
export function requiredIf(predicate: (predicateCtrl: AbstractControl) => boolean) {
  return (control: AbstractControl): ValidationErrors | null => {
    return predicate(control) ? Validators.required(control) : null;
  };
}
