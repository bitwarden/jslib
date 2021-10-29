import {
    Component,
    OnInit,
} from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { VerificationType } from 'jslib-common/enums/verificationType';

export type Verification = {
    type: VerificationType,
    secret: string,
};

@Component({
    selector: 'app-verify-master-password',
    templateUrl: 'verify-master-password.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: VerifyMasterPasswordComponent,
        },
    ],
})
export class VerifyMasterPasswordComponent implements ControlValueAccessor, OnInit {
    usesCryptoAgent: boolean = false;
    disableRequestOtp: boolean = false;

    secret = new FormControl('', {updateOn: 'blur'});

    private onChange: (value: Promise<Verification>) => void;

    constructor(private userService: UserService, private apiService: ApiService,
        private cryptoService: CryptoService) { }

    async ngOnInit() {
        this.usesCryptoAgent = await this.userService.getUsesCryptoAgent();

        this.secret.valueChanges.subscribe(async secret => {
            if (this.onChange == null) {
                return;
            }

            const promise = this.processForm(secret);
            this.onChange(promise);
        });
    }

    async requestOtp() {
        if (this.usesCryptoAgent) {
            this.disableRequestOtp = true;
            await this.apiService.postAccountRequestOtp();
        }
    }

    async processForm(secret: string): Promise<Verification> {
        if (secret == null || secret === "") {
            return null;
        }
        if (this.usesCryptoAgent) {
            return {
                type: VerificationType.OTP,
                secret: secret,
            };
        } else {
            return {
                type: VerificationType.MasterPassword,
                secret: await this.cryptoService.hashPassword(secret, null),
            };
        }
    }

    clearSecret() {
        this.secret.setValue('');
    }

    writeValue(obj: any): void {
        this.secret.setValue(obj);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        // Not implemented
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disableRequestOtp = isDisabled;
        if (isDisabled) {
            this.secret.disable();
        } else {
            this.secret.enable();
        }
    }
}
