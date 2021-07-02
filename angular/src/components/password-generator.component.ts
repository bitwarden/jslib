import {
    Directive,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';

import { PasswordGeneratorPolicyOptions } from 'jslib-common/models/domain/passwordGeneratorPolicyOptions';

@Directive()
export class PasswordGeneratorComponent implements OnInit {
    @Input() showSelect: boolean = false;
    @Output() onSelected = new EventEmitter<string>();

    passTypeOptions: any[];
    options: any = {};
    password: string = '-';
    showOptions = false;
    avoidAmbiguous = false;
    enforcedPolicyOptions: PasswordGeneratorPolicyOptions;

    constructor(protected passwordGenerationService: PasswordGenerationService,
        protected platformUtilsService: PlatformUtilsService, protected i18nService: I18nService,
        private win: Window) {
            this.passTypeOptions = [
                { name: i18nService.t('password'), value: 'password' },
                { name: i18nService.t('passphrase'), value: 'passphrase' },
            ];
         }

    async ngOnInit() {
        const optionsResponse = await this.passwordGenerationService.getOptions();
        this.options = optionsResponse[0];
        this.enforcedPolicyOptions = optionsResponse[1];
        this.avoidAmbiguous = !this.options.ambiguous;
        this.options.type = this.options.type === 'passphrase' ? 'passphrase' : 'password';
        this.password = await this.passwordGenerationService.generatePassword(this.options);
        await this.passwordGenerationService.addHistory(this.password);
    }

    async sliderChanged() {
        this.saveOptions(false);
        await this.passwordGenerationService.addHistory(this.password);
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
    }

    copy() {
        const copyOptions = this.win != null ? { window: this.win } : null;
        this.platformUtilsService.copyToClipboard(this.password, copyOptions);
        this.platformUtilsService.showToast('info', null,
            this.i18nService.t('valueCopied', this.i18nService.t('password')));
    }

    select() {
        this.onSelected.emit(this.password);
    }

    toggleOptions() {
        this.showOptions = !this.showOptions;
    }

    private normalizeOptions() {
        // Application level normalize options depedent on class variables
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

        this.passwordGenerationService.normalizeOptions(this.options, this.enforcedPolicyOptions);
    }
}
