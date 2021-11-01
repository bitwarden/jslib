import { Directive } from '@angular/core';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { StateService } from 'jslib-common/abstractions/state.service';

import { Utils } from 'jslib-common/misc/utils';

import { ModalRef } from './modal/modal.ref';

@Directive()
export class SetPinComponent {

    pin = '';
    showPin = false;
    masterPassOnRestart = true;

    constructor(private modalRef: ModalRef, private cryptoService: CryptoService,
        private stateService: StateService) { }

    toggleVisibility() {
        this.showPin = !this.showPin;
    }

    async submit() {
        if (Utils.isNullOrWhitespace(this.pin)) {
            this.modalRef.close(false);
        }

        const kdf = await this.stateService.getKdfType();
        const kdfIterations = await this.stateService.getKdfIterations();
        const email = await this.stateService.getEmail();
        const pinKey = await this.cryptoService.makePinKey(this.pin, email, kdf, kdfIterations);
        const key = await this.cryptoService.getKey();
        const pinProtectedKey = await this.cryptoService.encrypt(key.key, pinKey);
        if (this.masterPassOnRestart) {
            const encPin = await this.cryptoService.encrypt(this.pin);
            await this.stateService.setProtectedPin(encPin.encryptedString);
            await this.stateService.setDecryptedPinProtected(pinProtectedKey);
        } else {
            await this.stateService.setEncryptedPinProtected(pinProtectedKey.encryptedString);
        }

        this.modalRef.close(true);
    }
}
