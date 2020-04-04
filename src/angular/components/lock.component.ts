import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CryptoService } from '../../abstractions/crypto.service';
import { EnvironmentService } from '../../abstractions/environment.service';
import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StateService } from '../../abstractions/state.service';
import { StorageService } from '../../abstractions/storage.service';
import { UserService } from '../../abstractions/user.service';
import { VaultTimeoutService } from '../../abstractions/vaultTimeout.service';

import { ConstantsService } from '../../services/constants.service';

import { CipherString } from '../../models/domain/cipherString';
import { SymmetricCryptoKey } from '../../models/domain/symmetricCryptoKey';

import { Utils } from '../../misc/utils';

export class LockComponent implements OnInit {
    masterPassword: string = '';
    pin: string = '';
    showPassword: boolean = false;
    email: string;
    pinLock: boolean = false;
    webVaultHostname: string = '';

    protected successRoute: string = 'vault';
    protected onSuccessfulSubmit: () => void;

    private invalidPinAttempts = 0;
    private pinSet: [boolean, boolean];

    constructor(protected router: Router, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected messagingService: MessagingService,
        protected userService: UserService, protected cryptoService: CryptoService,
        protected storageService: StorageService, protected vaultTimeoutService: VaultTimeoutService,
        protected environmentService: EnvironmentService, protected stateService: StateService) { }

    async ngOnInit() {
        this.pinSet = await this.vaultTimeoutService.isPinLockSet();
        this.pinLock = (this.pinSet[0] && this.vaultTimeoutService.pinProtectedKey != null) || this.pinSet[1];
        this.email = await this.userService.getEmail();
        let vaultUrl = this.environmentService.getWebVaultUrl();
        if (vaultUrl == null) {
            vaultUrl = 'https://bitwarden.com';
        }
        this.webVaultHostname = Utils.getHostname(vaultUrl);
    }

    async submit() {
        if (this.pinLock && (this.pin == null || this.pin === '')) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('pinRequired'));
            return;
        }
        if (!this.pinLock && (this.masterPassword == null || this.masterPassword === '')) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }

        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();

        if (this.pinLock) {
            let failed = true;
            try {
                if (this.pinSet[0]) {
                    const key = await this.cryptoService.makeKeyFromPin(this.pin, this.email, kdf, kdfIterations,
                        this.vaultTimeoutService.pinProtectedKey);
                    const encKey = await this.cryptoService.getEncKey(key);
                    const protectedPin = await this.storageService.get<string>(ConstantsService.protectedPin);
                    const decPin = await this.cryptoService.decryptToUtf8(new CipherString(protectedPin), encKey);
                    failed = decPin !== this.pin;
                    if (!failed) {
                        await this.setKeyAndContinue(key);
                    }
                } else {
                    const key = await this.cryptoService.makeKeyFromPin(this.pin, this.email, kdf, kdfIterations);
                    failed = false;
                    await this.setKeyAndContinue(key);
                }
            } catch {
                failed = true;
            }

            if (failed) {
                this.invalidPinAttempts++;
                if (this.invalidPinAttempts >= 5) {
                    this.messagingService.send('logout');
                    return;
                }
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidPin'));
            }
        } else {
            const key = await this.cryptoService.makeKey(this.masterPassword, this.email, kdf, kdfIterations);
            const keyHash = await this.cryptoService.hashPassword(this.masterPassword, key);
            const storedKeyHash = await this.cryptoService.getKeyHash();

            if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
                if (this.pinSet[0]) {
                    const protectedPin = await this.storageService.get<string>(ConstantsService.protectedPin);
                    const encKey = await this.cryptoService.getEncKey(key);
                    const decPin = await this.cryptoService.decryptToUtf8(new CipherString(protectedPin), encKey);
                    const pinKey = await this.cryptoService.makePinKey(decPin, this.email, kdf, kdfIterations);
                    this.vaultTimeoutService.pinProtectedKey = await this.cryptoService.encrypt(key.key, pinKey);
                }
                this.setKeyAndContinue(key);
            } else {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidMasterPassword'));
            }
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
        document.getElementById(this.pinLock ? 'pin' : 'masterPassword').focus();
    }

    private async setKeyAndContinue(key: SymmetricCryptoKey) {
        await this.cryptoService.setKey(key);
        this.doContinue();
    }

    private async doContinue() {
        const disableFavicon = await this.storageService.get<boolean>(ConstantsService.disableFaviconKey);
        await this.stateService.save(ConstantsService.disableFaviconKey, !!disableFavicon);
        this.messagingService.send('unlocked');
        if (this.onSuccessfulSubmit != null) {
            this.onSuccessfulSubmit();
        } else if (this.router != null) {
            this.router.navigate([this.successRoute]);
        }
    }
}
