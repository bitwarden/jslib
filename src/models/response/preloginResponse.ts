import { KdfType } from '../../enums/kdfType';

export class PreloginResponse {
    kdf: KdfType;
    kdfIterations: number;

    constructor(response: any) {
        this.kdf = response.Kdf;
        this.kdfIterations = response.KdfIterations;
    }
}
