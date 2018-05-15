import * as fe from 'node-fetch';

import { ApiService } from './api.service';

import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { TokenService } from '../abstractions/token.service';

(global as any).fetch = fe.default;
(global as any).Request = fe.Request;
(global as any).Response = fe.Response;
(global as any).Headers = fe.Headers;

export class NodeApiService extends ApiService {
    constructor(tokenService: TokenService, platformUtilsService: PlatformUtilsService,
        logoutCallback: Function) {
        super(tokenService, platformUtilsService, logoutCallback);
    }
}
