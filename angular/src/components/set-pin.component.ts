import { Directive } from '@angular/core';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';
import { UserService } from 'jslib-common/abstractions/user.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service';

import { ConstantsService } from 'jslib-common/services/constants.service';

import { Utils } from 'jslib-common/misc/utils';

import { ModalRef } from './modal/modal.ref';

@Directive()
export class SetPinComponent {

    pin = '';
    showPin = false;
    masterPassOnRestart = true;

    constructor(private modalRef: ModalRef, private cryptoService: CryptoService, private userService: UserService,
        private storageService: StorageService, private vaultTimeoutService: VaultTimeoutService) { }

    toggleVisibility() {
        this.showPin = !this.showPin;
    }

    async submit() {
        if (Utils.isNullOrWhitespace(this.pin)) {
            this.modalRef.close(false);
        }

        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();
        const email = await this.userService.getEmail();
        const pinKey = await this.cryptoService.makePinKey(this.pin, email, kdf, kdfIterations);
        const key = await this.cryptoService.getKey();
        const pinProtectedKey = await this.cryptoService.encrypt(key.key, pinKey);
        if (this.masterPassOnRestart) {
            const encPin = await this.cryptoService.encrypt(this.pin);
            await this.storageService.save(ConstantsService.protectedPin, encPin.encryptedString);
            this.vaultTimeoutService.pinProtectedKey = pinProtectedKey;
        } else {
            await this.storageService.save(ConstantsService.pinProtectedKey, pinProtectedKey.encryptedString);
        }

        this.modalRef.close(true);
    }
}
