import { LogInDelegate } from "./logIn.delegate";

import { TokenRequestTwoFactor } from "../../models/request/identityToken/tokenRequest";

import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../abstractions/appId.service";
import { CryptoService } from "../../abstractions/crypto.service";
import { EnvironmentService } from "../../abstractions/environment.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { PlatformUtilsService } from "../../abstractions/platformUtils.service";
import { StateService } from "../../abstractions/state.service";
import { TokenService } from "../../abstractions/token.service";
import { TwoFactorService } from '../../abstractions/twoFactor.service';

import { ApiTokenRequest } from '../../models/request/identityToken/apiTokenRequest';
import { KeyConnectorService } from '../../abstractions/keyConnector.service';
import { IdentityTokenResponse } from '../../models/response/identityTokenResponse';

export class ApiLogInDelegate extends LogInDelegate {
  tokenRequest: ApiTokenRequest;

  constructor(
    cryptoService: CryptoService,
    apiService: ApiService,
    tokenService: TokenService,
    appIdService: AppIdService,
    platformUtilsService: PlatformUtilsService,
    messagingService: MessagingService,
    logService: LogService,
    stateService: StateService,
    setCryptoKeys = true,
    twoFactorService: TwoFactorService,
    private environmentService: EnvironmentService,
    private keyConnectorService: KeyConnectorService
  ) {
    super(cryptoService, apiService, tokenService, appIdService, platformUtilsService, messagingService, logService,
      stateService, twoFactorService, setCryptoKeys);
  }

  async init(
    clientId: string,
    clientSecret: string,
    twoFactor?: TokenRequestTwoFactor) {
    this.tokenRequest = new ApiTokenRequest(
      clientId,
      clientSecret,
      await this.buildTwoFactor(twoFactor),
      await this.buildDeviceRequest()
    );
  }

  async onSuccessfulLogin(tokenResponse: IdentityTokenResponse) {
    if (tokenResponse.apiUseKeyConnector) {
      const keyConnectorUrl = this.environmentService.getKeyConnectorUrl();
      await this.keyConnectorService.getAndSetKey(keyConnectorUrl);
    }
  }

  async saveAccountInformation(tokenResponse: IdentityTokenResponse) {
    await this.stateService.setApiKeyClientId(this.tokenRequest.clientId);
    await this.stateService.setApiKeyClientSecret(this.tokenRequest.clientSecret);
    super.saveAccountInformation(tokenResponse);
  }
}
