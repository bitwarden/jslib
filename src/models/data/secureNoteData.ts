import { SecureNoteType } from '../../enums';

export class SecureNoteData {
    type: SecureNoteType;

    constructor(data: any) {
        this.type = data.Type;
    }
}
