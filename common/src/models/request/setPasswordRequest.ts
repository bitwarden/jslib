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
}
