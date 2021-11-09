import { SecureNoteType } from '../../enums/secureNoteType';

import { ItemView } from './itemView';

import { SecureNote } from '../domain/secureNote';

export class SecureNoteView extends ItemView {
    type: SecureNoteType = null;

    constructor(n?: SecureNote) {
        super();
        if (!n) {
            return;
        }

        this.type = n.type;
    }

    get subTitle(): string {
        return null;
    }
}
