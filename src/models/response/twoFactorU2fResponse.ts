import { BaseResponse } from './baseResponse';

export class TwoFactorU2fResponse extends BaseResponse {
    enabled: boolean;
    keys: KeyResponse[];

    constructor(response: any) {
        super(response);
        this.enabled = this.getResponseProperty('Enabled');
        const keys = this.getResponseProperty('Keys');
        this.keys = keys == null ? null : keys.map((k: any) => new KeyResponse(k));
    }
}

export class KeyResponse extends BaseResponse {
    name: string;
    id: number;
    compromised: boolean;

    constructor(response: any) {
        super(response);
        this.name = this.getResponseProperty('Name');
        this.id = this.getResponseProperty('Id');
        this.compromised = this.getResponseProperty('Compromised');
    }
}

export class ChallengeResponse extends BaseResponse {
    userId: string;
    appId: string;
    challenge: string;
    version: string;

    constructor(response: any) {
        super(response);
        this.userId = this.getResponseProperty('UserId');
        this.appId = this.getResponseProperty('AppId');
        this.challenge = this.getResponseProperty('Challenge');
        this.version = this.getResponseProperty('Version');
    }
}
