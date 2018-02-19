import { View } from './view';

import { Attachment } from '../domain';

export class AttachmentView implements View {
    id: string;
    url: string;
    size: number;
    sizeName: string;
    fileName: string;

    constructor(a: Attachment) {
        this.id = a.id;
        this.url = a.url;
        this.size = a.size;
        this.sizeName = a.sizeName;
    }
}
