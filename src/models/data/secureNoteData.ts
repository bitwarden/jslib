import { SecureNoteType } from '../../enums/secureNoteType';

export class SecureNoteData {
    type: SecureNoteType;

    constructor(data: any) {
        this.type = data.Type;
    }
}
