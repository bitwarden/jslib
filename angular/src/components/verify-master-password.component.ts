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
import { KeyConnectorService } from 'jslib-common/abstractions/keyConnector.service';
import { UserVerificationService } from 'jslib-common/abstractions/userVerification.service';

import { VerificationType } from 'jslib-common/enums/verificationType';

import { Verification } from 'jslib-common/types/verification';

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
    usesKeyConnector: boolean = false;
    disableRequestOTP: boolean = false;

    secret = new FormControl('');

    private onChange: (value: Verification) => void;

    constructor(private keyConnectorService: KeyConnectorService,
        private userVerificationService: UserVerificationService) { }

    async ngOnInit() {
        this.usesKeyConnector = await this.keyConnectorService.getUsesKeyConnector();

        this.secret.valueChanges.subscribe(secret => {
            if (this.onChange == null) {
                return;
            }

            this.onChange({
                type: this.usesKeyConnector ? VerificationType.OTP : VerificationType.MasterPassword,
                secret: secret,
            });
        });
    }

    async requestOTP() {
        if (this.usesKeyConnector) {
            this.disableRequestOTP = true;
            await this.userVerificationService.requestOTP();
        }
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
        this.disableRequestOTP = isDisabled;
        if (isDisabled) {
            this.secret.disable();
        } else {
            this.secret.enable();
        }
    }
}
