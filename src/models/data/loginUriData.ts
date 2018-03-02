import { UriMatchType } from '../../enums/uriMatchType';

import { LoginUriApi } from '../api/loginUriApi';

export class LoginUriData {
    uri: string;
    match: UriMatchType = null;

    constructor(data: LoginUriApi) {
        this.uri = data.uri;
        this.match = data.match;
    }
}
