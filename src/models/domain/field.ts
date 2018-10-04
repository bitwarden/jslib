import { FieldType } from '../../enums/fieldType';

import { FieldData } from '../data/fieldData';

import { CipherString } from './cipherString';
import Domain from './domainBase';

import { FieldView } from '../view/fieldView';

export class Field extends Domain {
    name: CipherString;
    value: CipherString;
    type: FieldType;

    constructor(obj?: FieldData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.type = obj.type;
        this.buildDomainModel(this, obj, {
            name: null,
            value: null,
        }, alreadyEncrypted, []);
    }

    decrypt(orgId: string): Promise<FieldView> {
        return this.decryptObj(new FieldView(this), {
            name: null,
            value: null,
        }, orgId);
    }

    toFieldData(): FieldData {
        const f = new FieldData();
        this.buildDataModel(this, f, {
            name: null,
            value: null,
            type: null,
        }, ['type']);
        return f;
    }
}
