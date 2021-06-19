import { Directive, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StateService } from 'jslib-common/abstractions/state.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';
import { UserService } from 'jslib-common/abstractions/user.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service';

import { ConstantsService } from 'jslib-common/services/constants.service';

import { EncString } from 'jslib-common/models/domain/encString';
import { SymmetricCryptoKey } from 'jslib-common/models/domain/symmetricCryptoKey';

import { PasswordVerificationRequest } from 'jslib-common/models/request/passwordVerificationRequest';

import { Utils } from 'jslib-common/misc/utils';

import { HashPurpose } from 'jslib-common/enums/hashPurpose';

@Directive()
export class LockComponent implements OnInit {
    masterPassword: string = '';
    pin: string = '';
    showPassword: boolean = false;
    email: string;
    pinLock: boolean = false;
    webVaultHostname: string = '';
    formPromise: Promise<any>;
    supportsBiometric: boolean;
    biometricLock: boolean;
    biometricText: string;

    protected successRoute: string = 'vault';
    protected onSuccessfulSubmit: () => void;

    private invalidPinAttempts = 0;
    private pinSet: [boolean, boolean];

    constructor(protected router: Router, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected messagingService: MessagingService,
        protected userService: UserService, protected cryptoService: CryptoService,
        protected storageService: StorageService, protected vaultTimeoutService: VaultTimeoutService,
        protected environmentService: EnvironmentService, protected stateService: StateService,
        protected apiService: ApiService) { }

    async ngOnInit() {
        this.pinSet = await this.vaultTimeoutService.isPinLockSet();
        this.pinLock = (this.pinSet[0] && this.vaultTimeoutService.pinProtectedKey != null) || this.pinSet[1];
        this.supportsBiometric = await this.platformUtilsService.supportsBiometric();
        this.biometricLock = await this.vaultTimeoutService.isBiometricLockSet() &&
            (await this.cryptoService.hasKeyStored('biometric') || !this.platformUtilsService.supportsSecureStorage());
        this.biometricText = await this.storageService.get(ConstantsService.biometricText);
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
                    const decPin = await this.cryptoService.decryptToUtf8(new EncString(protectedPin), encKey);
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
            const storedKeyHash = await this.cryptoService.getKeyHash();

            let passwordValid = false;

            if (storedKeyHash != null) {
                passwordValid = await this.cryptoService.compareAndUpdateKeyHash(this.masterPassword, key);
            } else {
                const request = new PasswordVerificationRequest();
                const serverKeyHash = await this.cryptoService.hashPassword(this.masterPassword, key,
                    HashPurpose.ServerAuthorization);
                request.masterPasswordHash = serverKeyHash;
                try {
                    this.formPromise = this.apiService.postAccountVerifyPassword(request);
                    await this.formPromise;
                    passwordValid = true;
                    const localKeyHash = await this.cryptoService.hashPassword(this.masterPassword, key,
                        HashPurpose.LocalAuthorization);
                    await this.cryptoService.setKeyHash(localKeyHash);
                } catch { }
            }

            if (passwordValid) {
                if (this.pinSet[0]) {
                    const protectedPin = await this.storageService.get<string>(ConstantsService.protectedPin);
                    const encKey = await this.cryptoService.getEncKey(key);
                    const decPin = await this.cryptoService.decryptToUtf8(new EncString(protectedPin), encKey);
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

    async unlockBiometric() {
        if (!this.biometricLock) {
            return;
        }

        const success = (await this.cryptoService.getKey('biometric')) != null;

        if (success) {
            await this.doContinue();
        }
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
        document.getElementById(this.pinLock ? 'pin' : 'masterPassword').focus();
    }

    private async setKeyAndContinue(key: SymmetricCryptoKey) {
        await this.cryptoService.setKey(key);
        this.doContinue();
    }

    private async doContinue() {
        this.vaultTimeoutService.biometricLocked = false;
        this.vaultTimeoutService.everBeenUnlocked = true;
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
