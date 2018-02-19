import { FieldType } from '../../enums';

import { FieldData } from '../data';

import { CipherString } from './cipherString';
import Domain from './domain';

import { FieldView } from '../view';

export class Field extends Domain {
    name: CipherString;
    vault: CipherString;
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
}
