import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { AuthService } from '../../abstractions/auth.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { TwoFactorProviders } from '../../services/auth.service';

export class TwoFactorOptionsComponent implements OnInit {
    @Output() onProviderSelected = new EventEmitter<TwoFactorProviderType>();
    @Output() onRecoverSelected = new EventEmitter();

    providers: any[] = [];

    constructor(protected authService: AuthService, protected router: Router,
        protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected i18nService: I18nService, protected platformUtilsService: PlatformUtilsService,
        protected win: Window) { }

    ngOnInit() {
        if (this.authService.twoFactorProviders.has(TwoFactorProviderType.OrganizationDuo)) {
            this.providers.push(TwoFactorProviders[TwoFactorProviderType.OrganizationDuo]);
        }

        if (this.authService.twoFactorProviders.has(TwoFactorProviderType.Authenticator)) {
            this.providers.push(TwoFactorProviders[TwoFactorProviderType.Authenticator]);
        }

        if (this.authService.twoFactorProviders.has(TwoFactorProviderType.Yubikey)) {
            this.providers.push(TwoFactorProviders[TwoFactorProviderType.Yubikey]);
        }

        if (this.authService.twoFactorProviders.has(TwoFactorProviderType.Duo)) {
            this.providers.push(TwoFactorProviders[TwoFactorProviderType.Duo]);
        }

        if (this.authService.twoFactorProviders.has(TwoFactorProviderType.U2f) &&
            this.platformUtilsService.supportsU2f(this.win)) {
            this.providers.push(TwoFactorProviders[TwoFactorProviderType.U2f]);
        }

        if (this.authService.twoFactorProviders.has(TwoFactorProviderType.Email)) {
            this.providers.push(TwoFactorProviders[TwoFactorProviderType.Email]);
        }
    }

    choose(p: any) {
        this.onProviderSelected.emit(p.type);
    }

    recover() {
        this.analytics.eventTrack.next({ action: 'Selected Recover' });
        this.platformUtilsService.launchUri('https://help.bitwarden.com/article/lost-two-step-device/');
        this.onRecoverSelected.emit();
    }
}
