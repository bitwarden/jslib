import { SecureNoteType } from '../../enums/secureNoteType';

import { View } from './view';

import { SecureNote } from '../domain/secureNote';

export class SecureNoteView implements View {
    type: SecureNoteType = null;

    constructor(n?: SecureNote) {
        if (!n) {
            return;
        }

        this.type = n.type;
    }

    get subTitle(): string {
        return null;
    }
}
