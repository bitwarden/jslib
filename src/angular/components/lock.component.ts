import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { LockService } from '../../abstractions/lock.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StorageService } from '../../abstractions/storage.service';
import { UserService } from '../../abstractions/user.service';

import { ConstantsService } from '../../services/constants.service';

import { CipherString } from '../../models/domain/cipherString';
import { SymmetricCryptoKey } from '../../models/domain/symmetricCryptoKey';

export class LockComponent implements OnInit {
    masterPassword: string = '';
    pin: string = '';
    showPassword: boolean = false;
    email: string;
    pinLock: boolean = false;

    protected successRoute: string = 'vault';
    protected onSuccessfulSubmit: () => void;

    private invalidPinAttempts = 0;

    constructor(protected router: Router, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected messagingService: MessagingService,
        protected userService: UserService, protected cryptoService: CryptoService,
        protected storageService: StorageService, protected lockService: LockService) { }

    async ngOnInit() {
        this.pinLock = await this.lockService.isPinLockSet();
        this.email = await this.userService.getEmail();
    }

    async submit() {
        // PIN
        if (this.pinLock) {
            if (this.pin == null || this.pin === '') {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('pinRequired'));
                return;
            }

            const pinProtectedKey = await this.storageService.get<string>(ConstantsService.pinProtectedKey);
            try {
                const protectedKeyCs = new CipherString(pinProtectedKey);
                const pinKey = await this.cryptoService.makePinKey(this.pin, this.email);
                const decKey = await this.cryptoService.decryptToBytes(protectedKeyCs, pinKey);
                await this.setKeyAndContinue(new SymmetricCryptoKey(decKey));
            } catch {
                this.invalidPinAttempts++;
                if (this.invalidPinAttempts >= 5) {
                    this.messagingService.send('logout');
                    return;
                }
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidPin'));
            }
            return;
        }

        // Master Password
        if (this.masterPassword == null || this.masterPassword === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }

        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();
        const key = await this.cryptoService.makeKey(this.masterPassword, this.email, kdf, kdfIterations);
        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();

        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            this.setKeyAndContinue(key);
        } else {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
        }
    }

    async logOut() {
        const confirmed = await this.platformUtilsService.showDialog(this.i18nService.t('logOutConfirmation'),
            this.i18nService.t('logOut'), this.i18nService.t('logOut'), this.i18nService.t('cancel'));
        if (confirmed) {
            this.messagingService.send('logout');
        }
    }

    togglePassword() {
        this.platformUtilsService.eventTrack('Toggled Master Password on Unlock');
        this.showPassword = !this.showPassword;
        document.getElementById('masterPassword').focus();
    }

    private async setKeyAndContinue(key: SymmetricCryptoKey) {
        await this.cryptoService.setKey(key);
        this.messagingService.send('unlocked');
        if (this.onSuccessfulSubmit != null) {
            this.onSuccessfulSubmit();
        } else if (this.router != null) {
            this.router.navigate([this.successRoute]);
        }
    }
}
