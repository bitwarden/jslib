import { PlatformUtilsService } from '../abstractions';

import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { PasswordRepromptService as PasswordRepromptServiceAbstraction } from '../abstractions/passwordReprompt.service';

import { HashPurpose } from '../enums/hashPurpose';

export class PasswordRepromptService implements PasswordRepromptServiceAbstraction {
    constructor(private i18nService: I18nService, private cryptoService: CryptoService,
        private platformUtilService: PlatformUtilsService) { }

    protectedFields() {
        return ['TOTP', 'Password', 'H_Field', 'Card Number', 'Security Code'];
    }

    async showPasswordPrompt() {
        const passwordValidator = (value: string) => {
            return this.cryptoService.compareAndUpdateKeyHash(value, null);
        };

        return this.platformUtilService.showPasswordDialog(this.i18nService.t('passwordConfirmation'), this.i18nService.t('passwordConfirmationDesc'), passwordValidator);
    }
}
