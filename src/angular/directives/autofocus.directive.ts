import {
    Directive,
    ElementRef,
    Input,
} from '@angular/core';

import { Utils } from '../../misc/utils';

@Directive({
    selector: '[appAutofocus]',
})
export class AutofocusDirective {
    @Input() set appAutofocus(condition: boolean | string) {
        this.autofocus = condition === '' || condition === true;
    }

    private autofocus: boolean;

    constructor(private el: ElementRef) { }

    ngOnInit() {
        if (!Utils.isMobileBrowser && this.autofocus) {
            this.el.nativeElement.focus();
        }
    }
}
