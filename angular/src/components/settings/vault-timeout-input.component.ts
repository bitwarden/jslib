import {
    Component,
    OnInit,
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator
} from '@angular/forms';

import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';

import { PolicyType } from 'jslib-common/enums/policyType';
import { Policy } from 'jslib-common/models/domain/policy';

@Component({
    selector: 'app-vault-timeout-input',
    templateUrl: 'vault-timeout-input.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: VaultTimeoutInputComponent,
        },
        {
            provide: NG_VALIDATORS,
            multi: true,
            useExisting: VaultTimeoutInputComponent
        }
    ],
})
export class VaultTimeoutInputComponent implements ControlValueAccessor, Validator, OnInit {
    form = this.fb.group({
        vaultTimeout: [null],
        custom: this.fb.group({
            hours: [null],
            minutes: [null],
        }),
    });

    vaultTimeouts: { name: string; value: number; }[];
    vaultTimeoutPolicy: Policy;
    vaultTimeoutPolicyHours: number;
    vaultTimeoutPolicyMinutes: number;

    constructor(private fb: FormBuilder, private i18nService: I18nService,private policyService: PolicyService,
        private platformUtilsService: PlatformUtilsService) {
        this.vaultTimeouts = [
            { name: i18nService.t('oneMinute'), value: 1 },
            { name: i18nService.t('fiveMinutes'), value: 5 },
            { name: i18nService.t('fifteenMinutes'), value: 15 },
            { name: i18nService.t('thirtyMinutes'), value: 30 },
            { name: i18nService.t('oneHour'), value: 60 },
            { name: i18nService.t('fourHours'), value: 240 },
            { name: i18nService.t('onRefresh'), value: -1 },
            { name: i18nService.t('custom'), value: -2 },
        ];

        if (this.platformUtilsService.isDev()) {
            this.vaultTimeouts.push({ name: i18nService.t('never'), value: null });
        }
    }

    private onChange: (vaultTimeout: number) => void;
    private validatorChange: () => void;

    async ngOnInit() {
        const vaultTimeoutPolicy = await this.policyService.getAll(PolicyType.MaximumVaultTimeout);
        if (vaultTimeoutPolicy.length > 0 && vaultTimeoutPolicy[0].enabled) { // TODO: Replace with policyService.policyAppliesToUser
            this.vaultTimeoutPolicy = vaultTimeoutPolicy[0];
            this.vaultTimeoutPolicyHours = Math.floor(this.vaultTimeoutPolicy.data.minutes / 60);
            this.vaultTimeoutPolicyMinutes = this.vaultTimeoutPolicy.data.minutes % 60;

            this.vaultTimeouts = this.vaultTimeouts.filter(
                t => t.value <= this.vaultTimeoutPolicy.data.minutes && t.value !== -1 && t.value != null
            );
            this.validatorChange();
        }

        this.form.valueChanges.subscribe(async (value) => {
            this.onChange(this.getVaultTimeout(value));
        });

        // Assign the previous value to the custom fields
        this.form.get('vaultTimeout').valueChanges.subscribe((value) => {
            if (value != -2) {
                return;
            }

            const current = this.form.value.vaultTimeout;
            this.form.patchValue({
                custom: {
                    hours: Math.floor(current / 60),
                    minutes: current % 60,
                },
            });
        });
    }

    getVaultTimeout(value: any) {
        if (value.vaultTimeout !== -2) {
            return value.vaultTimeout;
        }

        return value.custom.hours * 60 + value.custom.minutes;
    }

    writeValue(value: number): void {
        if (value == null) {
            return;
        }

        if (this.vaultTimeouts.every(p => p.value !== value)) {
            this.form.setValue({
                vaultTimeout: -2,
                custom: {
                    hours: Math.floor(value / 60),
                    minutes: value % 60,
                },
            });
            return;
        }

        this.form.patchValue({
            vaultTimeout: value,
        });
    }

    registerOnChange(onChange: any): void {
        this.onChange = onChange;
    }

    // tslint:disable-next-line
    registerOnTouched(onTouched: any): void {}

    // tslint:disable-next-line
    setDisabledState?(isDisabled: boolean): void { }

    validate(control: AbstractControl): ValidationErrors {
        if (this.vaultTimeoutPolicy && this.vaultTimeoutPolicy?.data?.minutes < control.value) {
            return { policyError: true };
        }

        return null;
    }

    registerOnValidatorChange(fn: () => void): void {
        this.validatorChange = fn;
    }
}
