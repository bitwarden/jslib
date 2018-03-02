import { SecureNoteType } from '../../enums/secureNoteType';

export class SecureNoteApi {
    type: SecureNoteType;

    constructor(data: any) {
        this.type = data.Type;
    }
}
