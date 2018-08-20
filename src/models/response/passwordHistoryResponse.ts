export class PasswordHistoryResponse {
    password: string;
    lastUsedDate: string;

    constructor(response: any) {
        this.password = response.Password;
        this.lastUsedDate = response.LastUsedDate;
    }
}
