import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { AuthService } from '../../abstractions/auth.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

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
        this.platformUtilsService.eventTrack('Selected Recover');
        this.platformUtilsService.launchUri('https://help.bitwarden.com/article/lost-two-step-device/');
        this.onRecoverSelected.emit();
    }
}
