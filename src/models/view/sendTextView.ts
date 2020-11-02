import { View } from './view';

import { SendText } from '../domain/sendText';

export class SendTextView implements View {
    text: string = null;
    hidden: boolean;

    constructor(t?: SendText) {
        if (!t) {
            return;
        }

        this.hidden = t.hidden;
    }

    get maskedText(): string {
        return this.text != null ? '••••••••' : null;
    }
}
