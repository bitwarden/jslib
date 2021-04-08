import { SecureNoteType } from '../../enums/secureNoteType';

import { View } from './view';

import { SecureNote } from '../domain/secureNote';

export class SecureNoteView extends View {
    type: SecureNoteType = null;

    constructor(n?: SecureNote) {
        super();
        if (!n) {
            return;
        }

        this.type = n.type;
    }

    buildFromObj(obj: any) {
        this.buildViewModel(this, obj, {
            type: null,
        });
    }

    get subTitle(): string {
        return null;
    }
}
