import { View } from './view';

import { Password } from '../domain/password';

export class PasswordHistoryView extends View {
    password: string = null;
    lastUsedDate: Date = null;

    constructor(ph?: Password) {
        super();
        if (!ph) {
            return;
        }

        this.lastUsedDate = ph.lastUsedDate;
    }
}
