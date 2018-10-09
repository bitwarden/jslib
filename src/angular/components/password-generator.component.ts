import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class PasswordGeneratorComponent implements OnInit {
    @Input() showSelect: boolean = false;
    @Output() onSelected = new EventEmitter<string>();

    options: any = {};
    password: string = '-';
    showOptions = false;
    avoidAmbiguous = false;

    constructor(protected passwordGenerationService: PasswordGenerationService,
        protected platformUtilsService: PlatformUtilsService, protected i18nService: I18nService,
        private win: Window) { }

    async ngOnInit() {
        this.options = await this.passwordGenerationService.getOptions();
        this.avoidAmbiguous = !this.options.ambiguous;
        this.options.type = this.options.type === 'passphrase' ? 'passphrase' : 'password';
        this.password = await this.passwordGenerationService.generatePassword(this.options);
        this.platformUtilsService.eventTrack('Generated Password');
        await this.passwordGenerationService.addHistory(this.password);
    }

    async sliderChanged() {
        this.saveOptions(false);
        await this.passwordGenerationService.addHistory(this.password);
        this.platformUtilsService.eventTrack('Regenerated Password');
    }

    async sliderInput() {
        this.normalizeOptions();
        this.password = await this.passwordGenerationService.generatePassword(this.options);
    }

    async saveOptions(regenerate: boolean = true) {
        this.normalizeOptions();
        await this.passwordGenerationService.saveOptions(this.options);

        if (regenerate) {
            await this.regenerate();
        }
    }

    async regenerate() {
        this.password = await this.passwordGenerationService.generatePassword(this.options);
        await this.passwordGenerationService.addHistory(this.password);
        this.platformUtilsService.eventTrack('Regenerated Password');
    }

    copy() {
        this.platformUtilsService.eventTrack('Copied Generated Password');
        const copyOptions = this.win != null ? { window: this.win } : null;
        this.platformUtilsService.copyToClipboard(this.password, copyOptions);
        this.platformUtilsService.showToast('info', null,
            this.i18nService.t('valueCopied', this.i18nService.t('password')));
    }

    select() {
        this.platformUtilsService.eventTrack('Selected Generated Password');
        this.onSelected.emit(this.password);
    }

    toggleOptions() {
        this.showOptions = !this.showOptions;
    }

    private normalizeOptions() {
        this.options.minLowercase = 0;
        this.options.minUppercase = 0;
        this.options.ambiguous = !this.avoidAmbiguous;

        if (!this.options.uppercase && !this.options.lowercase && !this.options.number && !this.options.special) {
            this.options.lowercase = true;
            if (this.win != null) {
                const lowercase = this.win.document.querySelector('#lowercase') as HTMLInputElement;
                if (lowercase) {
                    lowercase.checked = true;
                }
            }
        }

        if (!this.options.length || this.options.length < 5) {
            this.options.length = 5;
        } else if (this.options.length > 128) {
            this.options.length = 128;
        }

        if (!this.options.minNumber) {
            this.options.minNumber = 0;
        } else if (this.options.minNumber > this.options.length) {
            this.options.minNumber = this.options.length;
        } else if (this.options.minNumber > 9) {
            this.options.minNumber = 9;
        }

        if (!this.options.minSpecial) {
            this.options.minSpecial = 0;
        } else if (this.options.minSpecial > this.options.length) {
            this.options.minSpecial = this.options.length;
        } else if (this.options.minSpecial > 9) {
            this.options.minSpecial = 9;
        }

        if (this.options.minSpecial + this.options.minNumber > this.options.length) {
            this.options.minSpecial = this.options.length - this.options.minNumber;
        }

        if (this.options.numWords == null || this.options.length < 3) {
            this.options.numWords = 3;
        } else if (this.options.numWords > 20) {
            this.options.numWords = 20;
        }

        if (this.options.wordSeparator != null && this.options.wordSeparator.length > 1) {
            this.options.wordSeparator = this.options.wordSeparator[0];
        }
    }
}
