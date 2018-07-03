export class RegisterRequest {
    name: string;
    email: string;
    masterPasswordHash: string;
    masterPasswordHint: string;
    key: string;
    keys: RegisterKeysRequest;
    token: string;
    organizationUserId: string;

    constructor(email: string, name: string, masterPasswordHash: string, masterPasswordHint: string, key: string) {
        this.name = name;
        this.email = email;
        this.masterPasswordHash = masterPasswordHash;
        this.masterPasswordHint = masterPasswordHint ? masterPasswordHint : null;
        this.key = key;
    }
}

export class RegisterKeysRequest {
    publicKey: string;
    encryptedPrivateKey: string;

    constructor(publicKey: string, encryptedPrivateKey: string) {
        this.publicKey = publicKey;
        this.encryptedPrivateKey = encryptedPrivateKey;
    }
}
