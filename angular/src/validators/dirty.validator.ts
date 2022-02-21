import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { requiredIf } from "./requiredIf.validator";

function dirtyValidator(validator: ValidatorFn) {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.dirty ? validator(control) : null;
  };
}

// Don't use the higher order function because it prevents hasError() from comparing validator functions for equality
export function dirtyRequired(control: AbstractControl): ValidationErrors | null {
  return control.dirty ? Validators.required(control) : null;
}

export function dirtyRequiredIf(predicate: (predicateCtrl: AbstractControl) => boolean) {
  return dirtyValidator(requiredIf(predicate));
}
