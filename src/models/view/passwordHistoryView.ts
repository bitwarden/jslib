import { View } from './view';

import { Password } from '../domain/password';

export class PasswordHistoryView implements View {
    password: string = null;
    lastUsedDate: Date = null;

    constructor(ph?: Password) {
        if (!ph) {
            return;
        }

        this.lastUsedDate = ph.lastUsedDate;
    }
}
