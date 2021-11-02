import { Injectable } from '@angular/core';

import { PasswordRepromptService as PasswordRepromptServiceAbstraction } from 'jslib-common/abstractions/passwordReprompt.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { PasswordRepromptComponent } from '../components/password-reprompt.component';
import { ModalService } from './modal.service';

@Injectable()
export class PasswordRepromptService implements PasswordRepromptServiceAbstraction {
    protected component = PasswordRepromptComponent;

    constructor(private modalService: ModalService, private userService: UserService) { }

    protectedFields() {
        return ['TOTP', 'Password', 'H_Field', 'Card Number', 'Security Code'];
    }

    async showPasswordPrompt() {
        const passwordRepromptDisabled = await this.userService.getUsesCryptoAgent();
        if (passwordRepromptDisabled) {
            return true;
        }

        const ref = this.modalService.open(this.component, {allowMultipleModals: true});

        if (ref == null) {
            return false;
        }

        const result = await ref.onClosedPromise();
        return result === true;
    }
}
