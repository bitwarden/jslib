import {
    AbstractControl,
    ValidationErrors,
    Validators,
} from '@angular/forms';

export function requiredIfValidator(predicate: (predicateCtrl: AbstractControl) => boolean) {
    return (control: AbstractControl): ValidationErrors | null => {
        return predicate(control)
            ? Validators.required(control)
            : null;
    };
}
