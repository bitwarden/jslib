import { SecureNoteType } from '../../enums';

import { SecureNoteData } from '../data';

import Domain from './domain';

import { SecureNoteView } from '../view';

export class SecureNote extends Domain {
    type: SecureNoteType;

    constructor(obj?: SecureNoteData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.type = obj.type;
    }

    decrypt(orgId: string): Promise<SecureNoteView> {
        return Promise.resolve(new SecureNoteView(this));
    }
}
