import {AutoTypeData} from '../data/autoTypeData';
import {AutoTypeView} from '../view/autoTypeView';
import {CipherString} from './cipherString';
import Domain from './domainBase';

export class AutoType extends Domain {
    target: CipherString;
    sequence: CipherString;
    tcato: boolean;

    constructor(obj?: AutoTypeData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.tcato = obj.tcato;
        this.buildDomainModel(this, obj, {
            target: null,
            sequence: null,
        }, alreadyEncrypted, []);
    }

    decrypt(orgId: string): Promise<AutoTypeView> {
        return this.decryptObj(new AutoTypeView(this), {
            target: null,
            sequence: null,
        }, orgId);
    }

    toAutoTypeData(): AutoTypeData {
        const f = new AutoTypeData();
        this.buildDataModel(this, f, {
            target: null,
            sequence: null,
            tcato: null,
        }, ['type']);
        return f;
    }
}
