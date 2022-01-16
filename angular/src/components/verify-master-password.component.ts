import { animate, style, transition, trigger } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";

import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { UserVerificationService } from "jslib-common/abstractions/userVerification.service";

import { VerificationType } from "jslib-common/enums/verificationType";

import { Verification } from "jslib-common/types/verification";

@Component({
  selector: "app-verify-master-password",
  templateUrl: "verify-master-password.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: VerifyMasterPasswordComponent,
    },
  ],
  animations: [
    trigger("sent", [
      transition(":enter", [style({ opacity: 0 }), animate("100ms", style({ opacity: 1 }))]),
    ]),
  ],
})
export class VerifyMasterPasswordComponent implements ControlValueAccessor, OnInit {
  usesKeyConnector: boolean = false;
  disableRequestOTP: boolean = false;
  sentCode: boolean = false;

  secret = new FormControl("");

  private onChange: (value: Verification) => void;

  constructor(
    private keyConnectorService: KeyConnectorService,
    private userVerificationService: UserVerificationService
  ) {}

  async ngOnInit() {
    this.usesKeyConnector = await this.keyConnectorService.getUsesKeyConnector();
    this.processChanges(this.secret.value);

    this.secret.valueChanges.subscribe((secret) => this.processChanges(secret));
  }

  async requestOTP() {
    if (this.usesKeyConnector) {
      this.disableRequestOTP = true;
      try {
        await this.userVerificationService.requestOTP();
        this.sentCode = true;
      } finally {
        this.disableRequestOTP = false;
      }
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

  private processChanges(secret: string) {
    if (this.onChange == null) {
      return;
    }

    this.onChange({
      type: this.usesKeyConnector ? VerificationType.OTP : VerificationType.MasterPassword,
      secret: secret,
    });
  }
}
