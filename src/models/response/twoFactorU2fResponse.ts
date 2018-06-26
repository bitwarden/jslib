export class TwoFactorU2fResponse {
    enabled: boolean;
    challenge: Challenge;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.challenge = new Challenge(response.Challenge);
    }
}

class Challenge {
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
