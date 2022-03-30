import * as FormData from "form-data";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as fe from "node-fetch";

import { AppIdService } from "jslib-common/abstractions/appId.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { TokenService } from "jslib-common/abstractions/token.service";
import { Utils } from "jslib-common/misc/utils";
import { DeviceRequest } from "jslib-common/models/request/deviceRequest";
import { ApiTokenRequest } from "jslib-common/models/request/identityToken/apiTokenRequest";
import { TokenRequestTwoFactor } from "jslib-common/models/request/identityToken/tokenRequestTwoFactor";
import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";
import { ApiService } from "jslib-common/services/api.service";

(global as any).fetch = fe.default;
(global as any).Request = fe.Request;
(global as any).Response = fe.Response;
(global as any).Headers = fe.Headers;
(global as any).FormData = FormData;

export class NodeApiService extends ApiService {
  constructor(
    tokenService: TokenService,
    platformUtilsService: PlatformUtilsService,
    environmentService: EnvironmentService,
    private appIdService: AppIdService,
    logoutCallback: (expired: boolean) => Promise<void>,
    customUserAgent: string = null
  ) {
    super(tokenService, platformUtilsService, environmentService, logoutCallback, customUserAgent);
  }

  nativeFetch(request: Request): Promise<Response> {
    const proxy = process.env.http_proxy || process.env.https_proxy;
    if (proxy) {
      (request as any).agent = new HttpsProxyAgent(proxy);
    }
    return fetch(request);
  }

  protected async doAuthRefresh(): Promise<void> {
    const clientId = await this.tokenService.getClientId();
    const clientSecret = await this.tokenService.getClientSecret();

    if (Utils.isNullOrWhitespace(clientId) || Utils.isNullOrWhitespace(clientSecret)) {
      throw new Error("Cannot refresh token, no api key stored");
    }

    const appId = await this.appIdService.getAppId();
    const deviceRequest = new DeviceRequest(appId, this.platformUtilsService);

    const tokenRequest = new ApiTokenRequest(
      clientId,
      clientSecret,
      new TokenRequestTwoFactor(),
      deviceRequest
    );

    const response = await this.postIdentityToken(tokenRequest);
    if (!(response instanceof IdentityTokenResponse)) {
      throw new Error("Invalid response received when refreshing api key token.");
    }

    await this.tokenService.setToken(response.accessToken);
  }
}
