import { SendType } from '../../enums/sendType';
import { Utils } from '../../misc/utils';

import { Send } from '../domain/send';
import { SymmetricCryptoKey } from '../domain/symmetricCryptoKey';

import { SendFileView } from './sendFileView';
import { SendTextView } from './sendTextView';
import { View } from './view';

export class SendView implements View {
    id: string = null;
    name: string = null;
    notes: string = null;
    key: SymmetricCryptoKey;
    type: SendType = null;
    text = new SendTextView();
    file = new SendFileView();
    maxAccessCount?: number = null;
    accessCount: number = 0;
    revisionDate: Date = null;
    deletionDate: Date = null;
    expirationDate: Date = null;
    password: string = null;
    disabled: boolean = false;

    constructor(s?: Send) {
        if (!s) {
            return;
        }

        this.id = s.id;
        this.type = s.type;
        this.maxAccessCount = s.maxAccessCount;
        this.accessCount = s.accessCount;
        this.revisionDate = s.revisionDate;
        this.deletionDate = s.deletionDate;
        this.expirationDate = s.expirationDate;
        this.disabled = s.disabled;
        this.password = s.password;
    }

    get urlB64Key(): string {
        return Utils.fromBufferToUrlB64(this.key.key);
    }
}
