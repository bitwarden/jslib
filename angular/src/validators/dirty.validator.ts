import {
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';

export function dirtyValidator(validator: ValidatorFn) {
    return (control: AbstractControl): ValidationErrors | null => {
        return control.dirty
            ? validator(control)
            : null;
    };
}
