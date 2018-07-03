import { KeysRequest } from './keysRequest';

export class RegisterRequest {
    name: string;
    email: string;
    masterPasswordHash: string;
    masterPasswordHint: string;
    key: string;
    keys: KeysRequest;
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
