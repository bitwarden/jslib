import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { OnInit } from '@angular/core';

import { CipherService } from '../../abstractions/cipher.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { PasswordHistoryView } from '../../models/view/passwordHistoryView';

export class PasswordHistoryComponent implements OnInit {
    cipherId: string;
    history: PasswordHistoryView[] = [];

    constructor(protected cipherService: CipherService, protected analytics: Angulartics2,
        protected platformUtilsService: PlatformUtilsService, protected i18nService: I18nService,
        protected toasterService: ToasterService, private win: Window) { }

    async ngOnInit() {
        const cipher = await this.cipherService.get(this.cipherId);
        const decCipher = await cipher.decrypt();
        this.history = decCipher.passwordHistory == null ? [] : decCipher.passwordHistory;
    }

    copy(password: string) {
        this.analytics.eventTrack.next({ action: 'Copied Password History' });
        const copyOptions = this.win != null ? { window: this.win } : null;
        this.platformUtilsService.copyToClipboard(password, copyOptions);
        this.toasterService.popAsync('info', null, this.i18nService.t('valueCopied', this.i18nService.t('password')));
    }
}
