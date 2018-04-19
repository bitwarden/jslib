import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { OnInit } from '@angular/core';

import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { PasswordHistory } from '../../models/domain/passwordHistory';

export class PasswordGeneratorHistoryComponent implements OnInit {
    history: PasswordHistory[] = [];

    constructor(protected passwordGenerationService: PasswordGenerationService, protected analytics: Angulartics2,
        protected platformUtilsService: PlatformUtilsService, protected i18nService: I18nService,
        protected toasterService: ToasterService, private win: Window) { }

    async ngOnInit() {
        this.history = await this.passwordGenerationService.getHistory();
    }

    clear() {
        this.history = [];
        this.passwordGenerationService.clear();
    }

    copy(password: string) {
        this.analytics.eventTrack.next({ action: 'Copied Historical Password' });
        const copyOptions = this.win != null ? { doc: this.win.document } : null;
        this.platformUtilsService.copyToClipboard(password, copyOptions);
        this.toasterService.popAsync('info', null, this.i18nService.t('valueCopied', this.i18nService.t('password')));
    }
}
