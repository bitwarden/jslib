import {AutoTypeApi} from '../api/autoTypeApi';

export class AutoTypeData {
    target: string;
    sequence: string;
    tcato: boolean;

    constructor(response?: AutoTypeApi) {
        if (response == null) {
            return;
        }
        this.target = response.target;
        this.sequence = response.sequence;
        this.tcato = response.tcato;
    }
}
