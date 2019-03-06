import { OnInit } from '@angular/core';

import { CipherService } from '../../abstractions/cipher.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { PasswordHistoryView } from '../../models/view/passwordHistoryView';

export class PasswordHistoryComponent implements OnInit {
    cipherId: string;
    history: PasswordHistoryView[] = [];

    constructor(protected cipherService: CipherService, protected platformUtilsService: PlatformUtilsService,
        protected i18nService: I18nService, private win: Window) { }

    async ngOnInit() {
        await this.init();
    }

    copy(password: string) {
        this.platformUtilsService.eventTrack('Copied Password History');
        const copyOptions = this.win != null ? { window: this.win } : null;
        this.platformUtilsService.copyToClipboard(password, copyOptions);
        this.platformUtilsService.showToast('info', null,
            this.i18nService.t('valueCopied', this.i18nService.t('password')));
    }

    protected async init() {
        const cipher = await this.cipherService.get(this.cipherId);
        const decCipher = await cipher.decrypt();
        this.history = decCipher.passwordHistory == null ? [] : decCipher.passwordHistory;
    }
}
