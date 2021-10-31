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

    secret = new FormControl('');

    private onChange: (value: Verification) => void;

    constructor(private userService: UserService, private apiService: ApiService) { }

    async ngOnInit() {
        this.usesCryptoAgent = await this.userService.getUsesCryptoAgent();

        this.secret.valueChanges.subscribe(secret => {
            if (this.onChange == null) {
                return;
            }

            this.onChange({
                type: this.usesCryptoAgent ? VerificationType.OTP : VerificationType.MasterPassword,
                secret: secret,
            });
        });
    }

    async requestOtp() {
        if (this.usesCryptoAgent) {
            this.disableRequestOtp = true;
            await this.apiService.postAccountRequestOtp();
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
