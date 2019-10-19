import {
    ChangeDetectorRef,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';

import { CipherType } from '../../enums/cipherType';
import { EventType } from '../../enums/eventType';
import { FieldType } from '../../enums/fieldType';

import { AuditService } from '../../abstractions/audit.service';
import { CipherService } from '../../abstractions/cipher.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { EventService } from '../../abstractions/event.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { TokenService } from '../../abstractions/token.service';
import { TotpService } from '../../abstractions/totp.service';
import { UserService } from '../../abstractions/user.service';

import { AttachmentView } from '../../models/view/attachmentView';
import { CipherView } from '../../models/view/cipherView';
import { FieldView } from '../../models/view/fieldView';
import { LoginUriView } from '../../models/view/loginUriView';
import { BroadcasterService } from '../services/broadcaster.service';

const BroadcasterSubscriptionId = 'ViewComponent';

export class ViewComponent implements OnDestroy, OnInit {
    @Input() cipherId: string;
    @Output() onEditCipher = new EventEmitter<CipherView>();

    cipher: CipherView;
    showPassword: boolean;
    showCardCode: boolean;
    canAccessPremium: boolean;
    totpCode: string;
    totpCodeFormatted: string;
    totpDash: number;
    totpSec: number;
    totpLow: boolean;
    fieldType = FieldType;
    checkPasswordPromise: Promise<number>;

    private totpInterval: any;
    private previousCipherId: string;

    constructor(protected cipherService: CipherService, protected totpService: TotpService,
        protected tokenService: TokenService, protected i18nService: I18nService,
        protected cryptoService: CryptoService, protected platformUtilsService: PlatformUtilsService,
        protected auditService: AuditService, protected win: Window,
        protected broadcasterService: BroadcasterService, protected ngZone: NgZone,
        protected changeDetectorRef: ChangeDetectorRef, protected userService: UserService,
        protected eventService: EventService) { }

    ngOnInit() {
        this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
            this.ngZone.run(async () => {
                switch (message.command) {
                    case 'syncCompleted':
                        if (message.successfully) {
                            await this.load();
                            this.changeDetectorRef.detectChanges();
                        }
                        break;
                }
            });
        });
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
        this.cleanUp();
    }

    async load() {
        this.cleanUp();

        const cipher = await this.cipherService.get(this.cipherId);
        this.cipher = await cipher.decrypt();
        this.canAccessPremium = await this.userService.canAccessPremium();

        if (this.cipher.type === CipherType.Login && this.cipher.login.totp &&
            (cipher.organizationUseTotp || this.canAccessPremium)) {
            await this.totpUpdateCode();
            const interval = this.totpService.getTimeInterval(this.cipher.login.totp);
            await this.totpTick(interval);

            this.totpInterval = setInterval(async () => {
                await this.totpTick(interval);
            }, 1000);
        }

        if (this.previousCipherId !== this.cipherId) {
            this.eventService.collect(EventType.Cipher_ClientViewed, this.cipherId);
        }
        this.previousCipherId = this.cipherId;
    }

    edit() {
        this.onEditCipher.emit(this.cipher);
    }

    togglePassword() {
        this.platformUtilsService.eventTrack('Toggled Password');
        this.showPassword = !this.showPassword;
        if (this.showPassword) {
            this.eventService.collect(EventType.Cipher_ClientToggledPasswordVisible, this.cipherId);
        }
    }

    toggleCardCode() {
        this.platformUtilsService.eventTrack('Toggled Card Code');
        this.showCardCode = !this.showCardCode;
        if (this.showCardCode) {
            this.eventService.collect(EventType.Cipher_ClientToggledCardCodeVisible, this.cipherId);
        }
    }

    async checkPassword() {
        if (this.cipher.login == null || this.cipher.login.password == null || this.cipher.login.password === '') {
            return;
        }

        this.platformUtilsService.eventTrack('Check Password');
        this.checkPasswordPromise = this.auditService.passwordLeaked(this.cipher.login.password);
        const matches = await this.checkPasswordPromise;

        if (matches > 0) {
            this.platformUtilsService.showToast('warning', null,
                this.i18nService.t('passwordExposed', matches.toString()));
        } else {
            this.platformUtilsService.showToast('success', null, this.i18nService.t('passwordSafe'));
        }
    }

    toggleFieldValue(field: FieldView) {
        const f = (field as any);
        f.showValue = !f.showValue;
        if (f.showValue) {
            this.eventService.collect(EventType.Cipher_ClientToggledHiddenFieldVisible, this.cipherId);
        }
    }

    launch(uri: LoginUriView) {
        if (!uri.canLaunch) {
            return;
        }

        this.platformUtilsService.eventTrack('Launched Login URI');
        this.platformUtilsService.launchUri(uri.launchUri);
    }

    copy(value: string, typeI18nKey: string, aType: string) {
        if (value == null) {
            return;
        }

        this.platformUtilsService.eventTrack('Copied ' + aType);
        const copyOptions = this.win != null ? { window: this.win } : null;
        this.platformUtilsService.copyToClipboard(value, copyOptions);
        this.platformUtilsService.showToast('info', null,
            this.i18nService.t('valueCopied', this.i18nService.t(typeI18nKey)));

        if (typeI18nKey === 'password') {
            this.eventService.collect(EventType.Cipher_ClientToggledHiddenFieldVisible, this.cipherId);
        } else if (typeI18nKey === 'securityCode') {
            this.eventService.collect(EventType.Cipher_ClientCopiedCardCode, this.cipherId);
        } else if (aType === 'H_Field') {
            this.eventService.collect(EventType.Cipher_ClientCopiedHiddenField, this.cipherId);
        }
    }

    setTextDataOnDrag(event: DragEvent, data: string) {
        event.dataTransfer.setData('text', data);
    }

    async downloadAttachment(attachment: AttachmentView) {
        const a = (attachment as any);
        if (a.downloading) {
            return;
        }

        if (this.cipher.organizationId == null && !this.canAccessPremium) {
            this.platformUtilsService.showToast('error', this.i18nService.t('premiumRequired'),
                this.i18nService.t('premiumRequiredDesc'));
            return;
        }

        a.downloading = true;
        const response = await fetch(new Request(attachment.url, { cache: 'no-cache' }));
        if (response.status !== 200) {
            this.platformUtilsService.showToast('error', null, this.i18nService.t('errorOccurred'));
            a.downloading = false;
            return;
        }

        try {
            const buf = await response.arrayBuffer();
            const key = attachment.key != null ? attachment.key :
                await this.cryptoService.getOrgKey(this.cipher.organizationId);
            const decBuf = await this.cryptoService.decryptFromBytes(buf, key);
            this.platformUtilsService.saveFile(this.win, decBuf, null, attachment.fileName);
        } catch (e) {
            this.platformUtilsService.showToast('error', null, this.i18nService.t('errorOccurred'));
        }

        a.downloading = false;
    }

    private cleanUp() {
        this.totpCode = null;
        this.cipher = null;
        this.showPassword = false;
        if (this.totpInterval) {
            clearInterval(this.totpInterval);
        }
    }

    private async totpUpdateCode() {
        if (this.cipher == null || this.cipher.type !== CipherType.Login || this.cipher.login.totp == null) {
            if (this.totpInterval) {
                clearInterval(this.totpInterval);
            }
            return;
        }

        this.totpCode = await this.totpService.getCode(this.cipher.login.totp);
        if (this.totpCode != null) {
            if (this.totpCode.length > 4) {
                const half = Math.floor(this.totpCode.length / 2);
                this.totpCodeFormatted = this.totpCode.substring(0, half) + ' ' + this.totpCode.substring(half);
            } else {
                this.totpCodeFormatted = this.totpCode;
            }
        } else {
            this.totpCodeFormatted = null;
            if (this.totpInterval) {
                clearInterval(this.totpInterval);
            }
        }
    }

    private async totpTick(intervalSeconds: number) {
        const epoch = Math.round(new Date().getTime() / 1000.0);
        const mod = epoch % intervalSeconds;

        this.totpSec = intervalSeconds - mod;
        this.totpDash = +(Math.round((((78.6 / intervalSeconds) * mod) + 'e+2') as any) + 'e-2');
        this.totpLow = this.totpSec <= 7;
        if (mod === 0) {
            await this.totpUpdateCode();
        }
    }
}
