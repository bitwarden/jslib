import { View } from './view';

import { Attachment } from '../domain/attachment';
import { SymmetricCryptoKey } from '../domain/symmetricCryptoKey';

export class AttachmentView implements View {
    id: string;
    url: string;
    size: number;
    sizeName: string;
    fileName: string;
    key: SymmetricCryptoKey;

    constructor(a?: Attachment) {
        if (!a) {
            return;
        }

        this.id = a.id;
        this.url = a.url;
        this.size = a.size;
        this.sizeName = a.sizeName;
    }
}
