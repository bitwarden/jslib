import { PasswordHistoryResponse } from '../response/passwordHistoryResponse';

export class PasswordHistoryData {
    password: string;
    lastUsedDate: Date;

    constructor(response?: PasswordHistoryResponse) {
        if (response == null) {
            return;
        }

        this.password = response.password;
        this.lastUsedDate = response.lastUsedDate;
    }
}
