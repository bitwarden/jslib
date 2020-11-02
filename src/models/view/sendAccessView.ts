import { SendType } from '../../enums/sendType';

import { SendAccess } from '../domain/sendAccess';

import { SendFileView } from './sendFileView';
import { SendTextView } from './sendTextView';
import { View } from './view';

export class SendAccessView implements View {
    id: string = null;
    name: string = null;
    type: SendType = null;
    text = new SendTextView();
    file = new SendFileView();

    constructor(s?: SendAccess) {
        if (!s) {
            return;
        }

        this.id = s.id;
        this.type = s.type;
    }
}
