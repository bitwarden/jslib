import { SecureNoteType } from '../../enums/secureNoteType';

import { View } from './view';

import { SecureNote } from '../domain/secureNote';

export class SecureNoteView implements View {
    type: SecureNoteType;

    constructor(n: SecureNote) {
        this.type = n.type;
    }
}
