import {
    Directive,
    ElementRef,
    HostListener,
} from '@angular/core';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

@Directive({
    selector: '[appFlexCopy]',
})
export class FlexCopyDirective {
    constructor(private el: ElementRef, private platformUtilsService: PlatformUtilsService) { }

    @HostListener('copy') onCopy() {
        if (window == null) {
            return;
        }
        let copyText = '';
        const selection = window.getSelection();
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const text = range.toString();
            copyText += text;
        }
        this.platformUtilsService.copyToClipboard(copyText, { window: window });
    }
}
