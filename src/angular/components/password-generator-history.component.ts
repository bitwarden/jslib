import { OnInit } from '@angular/core';

import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { GeneratedPasswordHistory } from '../../models/domain/generatedPasswordHistory';

export class PasswordGeneratorHistoryComponent implements OnInit {
    history: GeneratedPasswordHistory[] = [];

    constructor(protected passwordGenerationService: PasswordGenerationService,
        protected platformUtilsService: PlatformUtilsService, protected i18nService: I18nService,
        private win: Window) { }

    async ngOnInit() {
        this.history = await this.passwordGenerationService.getHistory();
    }

    clear() {
        this.history = [];
        this.passwordGenerationService.clear();
    }

    copy(password: string) {
        this.platformUtilsService.eventTrack('Copied Historical Password');
        const copyOptions = this.win != null ? { window: this.win } : null;
        this.platformUtilsService.copyToClipboard(password, copyOptions);
        this.platformUtilsService.showToast('info', null,
            this.i18nService.t('valueCopied', this.i18nService.t('password')));
    }
}
