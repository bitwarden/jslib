import { PlatformUtilsService } from '../abstractions';

import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { PasswordRepromptService as PasswordRepromptServiceAbstraction } from '../abstractions/passwordReprompt.service';

export class PasswordRepromptService implements PasswordRepromptServiceAbstraction {
    constructor(private i18nService: I18nService, private cryptoService: CryptoService,
        private platformUtilService: PlatformUtilsService) { }

    protectedFields() {
        return ['TOTP', 'Password', 'H_Field', 'Card Number', 'Security Code'];
    }

    async showPasswordPrompt() {
        const passwordValidator = async (value: string) => {
            const keyHash = await this.cryptoService.hashPassword(value, null);
            const storedKeyHash = await this.cryptoService.getKeyHash();

            if (storedKeyHash == null || keyHash == null || storedKeyHash !== keyHash) {
                return false;
            }
            return true;
        };

        return this.platformUtilService.showPasswordDialog(this.i18nService.t('passwordConfirmation'), this.i18nService.t('passwordConfirmationDesc'), passwordValidator);
    }
}
