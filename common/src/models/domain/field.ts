import { FieldType } from '../../enums/fieldType';

import { FieldData } from '../data/fieldData';

import Domain from './domainBase';
import { EncString } from './encString';

import { FieldView } from '../view/fieldView';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

export class Field extends Domain {
    name: EncString;
    value: EncString;
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

    decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<FieldView> {
        return this.decryptObj(new FieldView(this), {
            name: null,
            value: null,
        }, orgId, encKey);
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
