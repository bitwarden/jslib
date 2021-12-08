import {
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { requiredIf } from './requiredIf.validator';

function dirtyValidator(validator: ValidatorFn) {
    return (control: AbstractControl): ValidationErrors | null => {
        return control.dirty
            ? validator(control)
            : null;
    };
}

export function dirtyRequired() {
    return dirtyValidator(Validators.required);
}

export function dirtyRequiredIf(predicate: (predicateCtrl: AbstractControl) => boolean) {
    return dirtyValidator(requiredIf(predicate));
}
