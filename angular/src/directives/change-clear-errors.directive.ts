import {
    Directive,
    HostListener,
} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[appChangeClearErrors]',
})
export class ChangeClearErrorsDirective {
    constructor(private formControlDirective: NgControl) {
    }

    @HostListener('change') onChange() {
        this.formControlDirective.control.setErrors(null);
    }
}
