import Swal from 'sweetalert2/dist/sweetalert2.js';

import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { PasswordRepromptService } from '../abstractions/passwordReprompt.service';

export class BrowserPasswordRepromptService implements PasswordRepromptService {
    constructor(private i18nService: I18nService, private cryptoService: CryptoService) { }

    protectedFields() {
        return ['TOTP', 'Password', 'H_Field', 'Card Number', 'Security Code'];
    }

    async showPasswordPrompt() {
        const result = await Swal.fire({
            heightAuto: false,
            title: this.i18nService.t('passwordConfirmation'),
            input: 'password',
            text: this.i18nService.t('passwordConfirmationDesc'),
            confirmButtonText: this.i18nService.t('ok'),
            showCancelButton: true,
            cancelButtonText: this.i18nService.t('cancel'),
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off',
            },
            inputValidator: async (value: string): Promise<any> => {
                const keyHash = await this.cryptoService.hashPassword(value, null);
                const storedKeyHash = await this.cryptoService.getKeyHash();

                if (storedKeyHash == null || keyHash == null || storedKeyHash !== keyHash) {
                    return this.i18nService.t('invalidMasterPassword');
                }
                return false;
            },
        });

        return result.isConfirmed === true;
    }
}
