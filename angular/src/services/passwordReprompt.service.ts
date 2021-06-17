import { ComponentRef, Injectable } from '@angular/core';

import { PasswordRepromptService as PasswordRepromptServiceAbstraction } from 'jslib-common/abstractions/passwordReprompt.service';
import { first } from 'rxjs/operators';

import { ModalComponent } from '../components/modal.component';
import { PasswordRepromptComponent } from '../components/password-reprompt.component';
import { ModalService } from './modal.service';

@Injectable()
export class PasswordRepromptService implements PasswordRepromptServiceAbstraction {
    repromptComponentRef: ComponentRef<ModalComponent>;

    constructor(private modalService: ModalService) { }

    protectedFields() {
        return ['TOTP', 'Password', 'H_Field', 'Card Number', 'Security Code'];
    }

    async showPasswordPrompt() {
        const ref = this.modalService.open(PasswordRepromptComponent, null);

        const result = await ref.onClosed.pipe(first()).toPromise();
        return result === true;
    }

}
