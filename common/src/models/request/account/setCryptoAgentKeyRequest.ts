import { KeysRequest } from '../keysRequest';

import { KdfType } from '../../../enums/kdfType';

export class SetCryptoAgentKeyRequest {
    key: string;
    keys: KeysRequest;
    kdf: KdfType;
    kdfIterations: number;
    orgIdentifier: string;

    constructor(key: string, kdf: KdfType, kdfIterations: number, orgIdentifier: string, keys: KeysRequest) {
        this.key = key;
        this.kdf = kdf;
        this.kdfIterations = kdfIterations;
        this.orgIdentifier = orgIdentifier;
        this.keys = keys;
    }
}
