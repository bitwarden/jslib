export class PasswordHistoryRequest {
    password: string;
    lastUsedDate: Date;

    constructor(response: any) {
        this.password = response.Password;
        this.lastUsedDate = response.LastUsedDate;
    }
}
