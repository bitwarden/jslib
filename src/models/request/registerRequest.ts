import { KeysRequest } from './keysRequest';

import { KdfType } from '../../enums/kdfType';

export class RegisterRequest {
    name: string;
    email: string;
    masterPasswordHash: string;
    masterPasswordHint: string;
    key: string;
    keys: KeysRequest;
    token: string;
    organizationUserId: string;
    kdf: KdfType;
    kdfIterations: number;

    constructor(email: string, name: string, masterPasswordHash: string, masterPasswordHint: string, key: string,
        kdf: KdfType, kdfIterations: number) {
        this.name = name;
        this.email = email;
        this.masterPasswordHash = masterPasswordHash;
        this.masterPasswordHint = masterPasswordHint ? masterPasswordHint : null;
        this.key = key;
        this.kdf = kdf;
        this.kdfIterations = kdfIterations;
    }
}
