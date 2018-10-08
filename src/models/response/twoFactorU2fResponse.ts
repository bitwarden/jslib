export class TwoFactorU2fResponse {
    enabled: boolean;
    keys: KeyResponse[];

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.keys = response.Keys == null ? null : response.Keys.map((k: any) => new KeyResponse(k));
    }
}

export class KeyResponse {
    name: string;
    id: number;
    compromised: boolean;

    constructor(response: any) {
        this.name = response.Name;
        this.id = response.Id;
        this.compromised = response.Compromised;
    }
}

export class ChallengeResponse {
    userId: string;
    appId: string;
    challenge: string;
    version: string;

    constructor(response: any) {
        this.userId = response.UserId;
        this.appId = response.AppId;
        this.challenge = response.Challenge;
        this.version = response.Version;
    }
}
