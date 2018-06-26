export class TwoFactorRecoverResponse {
    code: string;

    constructor(response: any) {
        this.code = response.Code;
    }
}
