import {AutoType} from '../domain/autoType';
import {View} from './view';

export class AutoTypeView implements View {
    target: string = null;
    sequence: string = null;
    tcato: boolean = null;

    constructor(f?: AutoType) {
        if (!f) {
            return;
        }

        this.tcato = f.tcato;
    }
}
