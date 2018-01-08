import { SecureNoteType } from '../../enums/secureNoteType';

class SecureNoteData {
    type: SecureNoteType;

    constructor(data: any) {
        this.type = data.Type;
    }
}

export { SecureNoteData };
(window as any).SecureNoteData = SecureNoteData;
