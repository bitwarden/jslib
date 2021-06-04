import { BaseResponse } from './baseResponse';

import { KdfType } from '../../enums/kdfType';

export class PreloginResponse extends BaseResponse {
    kdf: KdfType;
    kdfIterations: number;

    constructor(response: any) {
        super(response);
        this.kdf = this.getResponseProperty('Kdf');
        this.kdfIterations = this.getResponseProperty('KdfIterations');
    }
}
