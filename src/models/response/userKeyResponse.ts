export class UserKeyResponse {
    userId: string;
    publicKey: string;

    constructor(response: any) {
        this.userId = response.UserId;
        this.publicKey = response.PublicKey;
    }
}
