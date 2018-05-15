import { Utils } from '../misc/utils';

import { ApiService } from './api.service';

import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { TokenService } from '../abstractions/token.service';

import * as fetch from 'node-fetch';

export class NodeApiService extends ApiService {
    constructor(tokenService: TokenService, platformUtilsService: PlatformUtilsService,
        logoutCallback: Function) {
        super(tokenService, platformUtilsService, logoutCallback);
    }
}
