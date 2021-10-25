import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnInit,
    ViewChild,
} from '@angular/core';

import { I18nService } from 'jslib-common/abstractions/i18n.service';

import { MasterPasswordPolicyOptions } from 'jslib-common/models/domain/masterPasswordPolicyOptions';

@Component({
    selector: 'app-callout',
    templateUrl: 'callout.component.html',
})
export class CalloutComponent implements OnInit, AfterViewInit {
    @Input() type = 'info';
    @Input() icon: string;
    @Input() title: string;
    @Input() clickable: boolean;
    @Input() enforcedPolicyOptions: MasterPasswordPolicyOptions;
    @Input() enforcedPolicyMessage: string;
    @Input() enforceAlert = false;

    @ViewChild('callout', { read: ElementRef, static: true }) calloutFormRef: ElementRef;

    calloutStyle: string;

    constructor(private i18nService: I18nService, private element: ElementRef) { }

    ngOnInit() {
        this.calloutStyle = this.type;

        if (this.enforcedPolicyMessage === undefined) {
            this.enforcedPolicyMessage = this.i18nService.t('masterPasswordPolicyInEffect');
        }

        if (this.type === 'warning' || this.type === 'danger') {
            if (this.type === 'danger') {
                this.calloutStyle = 'danger';
            }
            if (this.title === undefined) {
                this.title = this.i18nService.t('warning');
            }
            if (this.icon === undefined) {
                this.icon = 'fa-warning';
            }
        } else if (this.type === 'error') {
            this.calloutStyle = 'danger';
            if (this.title === undefined) {
                this.title = this.i18nService.t('error');
            }
            if (this.icon === undefined) {
                this.icon = 'fa-bolt';
            }
        } else if (this.type === 'tip') {
            this.calloutStyle = 'success';
            if (this.title === undefined) {
                this.title = this.i18nService.t('tip');
            }
            if (this.icon === undefined) {
                this.icon = 'fa-lightbulb-o';
            }
        }
    }

    ngAfterViewInit() {
        if (this.enforceAlert) {
            this.element.nativeElement.setAttribute('role', 'alert');
        }
    }

    getPasswordScoreAlertDisplay() {
        if (this.enforcedPolicyOptions == null) {
            return '';
        }

        let str: string;
        switch (this.enforcedPolicyOptions.minComplexity) {
            case 4:
                str = this.i18nService.t('strong');
                break;
            case 3:
                str = this.i18nService.t('good');
                break;
            default:
                str = this.i18nService.t('weak');
                break;
        }
        return str + ' (' + this.enforcedPolicyOptions.minComplexity + ')';
    }
}
