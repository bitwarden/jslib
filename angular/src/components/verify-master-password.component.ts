import {
    Component,
    OnInit,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { UserService } from 'jslib-common/abstractions/user.service';

export type Verification = {
    type: 'MasterPassword' | 'OTP',
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

    secret = new FormControl('');

    private onChange: (value: Verification) => void;

    constructor(private userService: UserService, private apiService: ApiService) { }

    async ngOnInit() {
        this.usesCryptoAgent = await this.userService.getUsesCryptoAgent();

        if (this.usesCryptoAgent) {
            this.apiService.postAccountRequestOtp();
        }

        this.secret.valueChanges.subscribe(secret => {
            if (this.onChange == null) {
                return;
            }

            this.onChange({
                type: this.usesCryptoAgent ? 'OTP' : 'MasterPassword',
                secret: secret,
            });
        });
    }

    writeValue(obj: any): void {
        // Not implemented
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        // Not implemented
    }

    setDisabledState?(isDisabled: boolean): void {
        // Not implemented
    }
}
