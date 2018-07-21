export class TwoFactorU2fResponse {
    enabled: boolean;
    challenge: ChallengeResponse;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.challenge = response.Challenge == null ? null : new ChallengeResponse(response.Challenge);
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
