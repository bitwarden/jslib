import {
    Directive,
    EventEmitter,
    OnInit,
    Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { TwoFactorProviderType } from 'jslib-common/enums/twoFactorProviderType';

import { AuthService } from 'jslib-common/abstractions/auth.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';

@Directive()
export class TwoFactorOptionsComponent implements OnInit {
    @Output() onProviderSelected = new EventEmitter<TwoFactorProviderType>();
    @Output() onRecoverSelected = new EventEmitter();

    providers: any[] = [];

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected platformUtilsService: PlatformUtilsService,
        protected win: Window) { }

    ngOnInit() {
        this.providers = this.authService.getSupportedTwoFactorProviders(this.win);
    }

    choose(p: any) {
        this.onProviderSelected.emit(p.type);
    }

    recover() {
        this.platformUtilsService.launchUri('https://help.bitwarden.com/article/lost-two-step-device/');
        this.onRecoverSelected.emit();
    }
}
