import {
    Directive,
    ElementRef,
    HostListener,
} from '@angular/core';

@Directive({
    selector: 'input[appChangeStripSpaces]',
})
export class ChangeStripSpacesDirective {
    constructor(private el: ElementRef<HTMLInputElement>) { }

    @HostListener('change') onChange() {
        this.el.nativeElement.value = this.el.nativeElement.value.replace(/ /g, '');
    }
}
