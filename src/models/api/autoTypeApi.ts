import {BaseResponse} from '../response/baseResponse';

export class AutoTypeApi extends BaseResponse {
    target: string;
    sequence: string;
    tcato: boolean;

    constructor(data: any = null) {
        super(data);
        if (data == null) {
            return;
        }
        this.target = this.getResponseProperty('Target');
        this.sequence = this.getResponseProperty('Sequence');
        this.tcato = this.getResponseProperty('TCATO');
    }
}
