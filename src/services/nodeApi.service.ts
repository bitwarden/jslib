import * as FormData from 'form-data';
import * as fe from 'node-fetch';

import { ApiService } from './api.service';

import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { TokenService } from '../abstractions/token.service';

(global as any).fetch = fe.default;
(global as any).Request = fe.Request;
(global as any).Response = fe.Response;
(global as any).Headers = fe.Headers;
(global as any).FormData = FormData;

export class NodeApiService extends ApiService {
    constructor(tokenService: TokenService, platformUtilsService: PlatformUtilsService,
        logoutCallback: (expired: boolean) => Promise<void>) {
        super(tokenService, platformUtilsService, logoutCallback);
    }
}
