import { View } from './view';

import { Attachment } from '../domain/attachment';

export class AttachmentView implements View {
    id: string;
    url: string;
    size: number;
    sizeName: string;
    fileName: string;

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
