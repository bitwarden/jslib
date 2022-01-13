import { Directive, Input, NgZone, OnInit } from "@angular/core";

import { Router } from "@angular/router";

import { take } from "rxjs/operators";

import { AuthResult } from "jslib-common/models/domain/authResult";

import { AuthRequestCreateRequest } from "jslib-common/models/request/authRequestCreateRequest";

import { ApiService } from "jslib-common/abstractions/api.service";
import { AppIdService } from "jslib-common/abstractions/appId.service";
import { AuthService } from "jslib-common/abstractions/auth.service";
import { BroadcasterService } from "jslib-common/abstractions/broadcaster.service";
import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { PasswordGenerationService } from "jslib-common/abstractions/passwordGeneration.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { StateService } from "jslib-common/abstractions/state.service";

import { Utils } from "jslib-common/misc/utils";

import { CaptchaProtectedComponent } from "./captchaProtected.component";

import { AuthRequestType } from "jslib-common/enums/authRequestType";
import { AuthRequestResponse } from "jslib-common/models/response/authRequestResponse";
import { MessagingService } from "jslib-common/abstractions/messaging.service";

const BroadcasterSubscriptionId = "LoginComponent";

@Directive()
export class LoginComponent extends CaptchaProtectedComponent implements OnInit {
  @Input() email: string = "";
  @Input() rememberEmail = true;

  masterPassword: string = "";
  showPassword: boolean = false;
  formPromise: Promise<AuthResult>;
  onSuccessfulLogin: () => Promise<any>;
  onSuccessfulLoginNavigate: () => Promise<any>;
  onSuccessfulLoginTwoFactorNavigate: () => Promise<any>;
  onSuccessfulLoginForceResetNavigate: () => Promise<any>;

  protected twoFactorRoute = "2fa";
  protected successRoute = "vault";
  protected forcePasswordResetRoute = "update-temp-password";

  constructor(
    protected authService: AuthService,
    protected router: Router,
    platformUtilsService: PlatformUtilsService,
    i18nService: I18nService,
    protected stateService: StateService,
    environmentService: EnvironmentService,
    protected passwordGenerationService: PasswordGenerationService,
    protected cryptoFunctionService: CryptoFunctionService,
    protected logService: LogService,
    protected ngZone: NgZone,
    protected apiService: ApiService,
    protected appIdService: AppIdService,
    protected broadcasterService: BroadcasterService,
    protected cryptoService: CryptoService,
    protected messagingService: MessagingService
  ) {
    super(environmentService, i18nService, platformUtilsService);
  }

  async ngOnInit() {
    if (this.email == null || this.email === "") {
      this.email = await this.stateService.getRememberedEmail();
      if (this.email == null) {
        this.email = "";
      }
    }
    this.rememberEmail = (await this.stateService.getRememberedEmail()) != null;
    if (Utils.isBrowser && !Utils.isNode) {
      this.focusInput();
    }

    this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
      this.ngZone.run(async () => {
        switch (message.command) {
          case "authRequestResponse":
            const authRequestId = message.id;
            console.log('Got request response for ' + authRequestId);
            break;
        }
      });
    });
  }

  ngOnDestroy() {
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
  }

  async submit() {
    await this.setupCaptcha();

    if (this.email == null || this.email === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("emailRequired")
      );
      return;
    }
    if (this.email.indexOf("@") === -1) {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("invalidEmail")
      );
      return;
    }
    if (this.masterPassword == null || this.masterPassword === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("masterPassRequired")
      );
      return;
    }

    try {
      this.formPromise = this.authService.logIn(this.email, this.masterPassword, this.captchaToken);
      const response = await this.formPromise;
      if (this.rememberEmail) {
        await this.stateService.setRememberedEmail(this.email);
      } else {
        await this.stateService.setRememberedEmail(null);
      }
      if (this.handleCaptchaRequired(response)) {
        return;
      } else if (response.twoFactor) {
        if (this.onSuccessfulLoginTwoFactorNavigate != null) {
          this.onSuccessfulLoginTwoFactorNavigate();
        } else {
          this.router.navigate([this.twoFactorRoute]);
        }
      } else if (response.forcePasswordReset) {
        if (this.onSuccessfulLoginForceResetNavigate != null) {
          this.onSuccessfulLoginForceResetNavigate();
        } else {
          this.router.navigate([this.forcePasswordResetRoute]);
        }
      } else {
        const disableFavicon = await this.stateService.getDisableFavicon();
        await this.stateService.setDisableFavicon(!!disableFavicon);
        if (this.onSuccessfulLogin != null) {
          this.onSuccessfulLogin();
        }
        if (this.onSuccessfulLoginNavigate != null) {
          this.onSuccessfulLoginNavigate();
        } else {
          this.router.navigate([this.successRoute]);
        }
      }
    } catch (e) {
      this.logService.error(e);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    if (this.ngZone.isStable) {
      document.getElementById("masterPassword").focus();
    } else {
      this.ngZone.onStable
        .pipe(take(1))
        .subscribe(() => document.getElementById("masterPassword").focus());
    }
  }

  async startPasswordlessLogin() {
    const keypair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
    const fingerprint = await this.cryptoService.getFingerprint(
      this.email, keypair[0]);

    const request = new AuthRequestCreateRequest();
    request.email = this.email;
    request.deviceIdentifier = await this.appIdService.getAppId();
    request.publicKey = Utils.fromBufferToB64(keypair[0]);
    request.type = AuthRequestType.AuthenticateAndUnlock;
    request.accessCode = await this.passwordGenerationService.generatePassword({ length: 25 });

    const reqResponse = await this.apiService.postAuthRequest(request);

    let canceledRequest = false;

    this.platformUtilsService.showDialog(
      `Please approve the new login request from another Bitwarden device that you are already logged in to.<br /><br />
      <b><u>Public Key Fingerprint</u></b><br />
      <code>${fingerprint.join("-")}</code>`,
      'Waiting for response...',
      'Cancel',
      null,
      null,
      true,
    ).then(result => {
      canceledRequest = true;
    });

    let response: AuthRequestResponse = null;
    while (!canceledRequest) {
      // sleep
      await new Promise(res => setTimeout(res, 2000));

      try {
        response = await this.apiService.getAuthRequestResponse(reqResponse.id, request.accessCode);
        if (response.key != null && response.masterPasswordHash != null) {
          break;
        }
      } catch (e) {

      }
    }

    this.messagingService.send('closeDialog');
    if (response != null) {
      const decKey = await this.cryptoService.rsaDecrypt(response.key, keypair[1]);
      const decMasterPasswordHash = await this.cryptoService.rsaDecrypt(response.masterPasswordHash, keypair[1]);

      try {
        this.formPromise = this.authService.logInAuthRequest(this.email, request.accessCode, reqResponse.id, decKey,
          decMasterPasswordHash, this.captchaToken);
        const response = await this.formPromise;
        if (this.handleCaptchaRequired(response)) {
          return;
        } else if (response.twoFactor) {
          if (this.onSuccessfulLoginTwoFactorNavigate != null) {
            this.onSuccessfulLoginTwoFactorNavigate();
          } else {
            this.router.navigate([this.twoFactorRoute]);
          }
        } else {
          const disableFavicon = await this.stateService.getDisableFavicon();
          await this.stateService.setDisableFavicon(!!disableFavicon);
          if (this.onSuccessfulLogin != null) {
            this.onSuccessfulLogin();
          }
          if (this.onSuccessfulLoginNavigate != null) {
            this.onSuccessfulLoginNavigate();
          } else {
            this.router.navigate([this.successRoute]);
          }
        }
      } catch (e) {
        this.logService.error(e);
      }
    }
  }

  async launchSsoBrowser(clientId: string, ssoRedirectUri: string) {
    // Generate necessary sso params
    const passwordOptions: any = {
      type: "password",
      length: 64,
      uppercase: true,
      lowercase: true,
      numbers: true,
      special: false,
    };
    const state = await this.passwordGenerationService.generatePassword(passwordOptions);
    const ssoCodeVerifier = await this.passwordGenerationService.generatePassword(passwordOptions);
    const codeVerifierHash = await this.cryptoFunctionService.hash(ssoCodeVerifier, "sha256");
    const codeChallenge = Utils.fromBufferToUrlB64(codeVerifierHash);

    // Save sso params
    await this.stateService.setSsoState(state);
    await this.stateService.setSsoCodeVerifier(ssoCodeVerifier);

    // Build URI
    const webUrl = this.environmentService.getWebVaultUrl();

    // Launch browser
    this.platformUtilsService.launchUri(
      webUrl +
      "/#/sso?clientId=" +
      clientId +
      "&redirectUri=" +
      encodeURIComponent(ssoRedirectUri) +
      "&state=" +
      state +
      "&codeChallenge=" +
      codeChallenge
    );
  }

  protected focusInput() {
    document
      .getElementById(this.email == null || this.email === "" ? "email" : "masterPassword")
      .focus();
  }
}
