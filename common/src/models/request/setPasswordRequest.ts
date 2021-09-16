import { KeysRequest } from './keysRequest';

import { KdfType } from '../../enums/kdfType';

export class SetPasswordRequest {
    masterPasswordHash: string;
    key: string;
    masterPasswordHint: string;
    keys: KeysRequest;
    kdf: KdfType;
    kdfIterations: number;
    orgIdentifier: string;

    constructor(masterPasswordHash: string, key: string, masterPasswordHint: string, kdf: KdfType,
        kdfIterations: number, orgIdentifier: string, keys: KeysRequest) {
        this.masterPasswordHash = masterPasswordHash;
        this.key = key;
        this.masterPasswordHint = masterPasswordHint;
        this.kdf = kdf;
        this.kdfIterations = kdfIterations;
        this.orgIdentifier = orgIdentifier;
        this.keys = keys;
    }
}
