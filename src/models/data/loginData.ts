export class LoginData {
    uri: string;
    username: string;
    password: string;
    totp: string;

    constructor(data: any) {
        this.uri = data.Uri;
        this.username = data.Username;
        this.password = data.Password;
        this.totp = data.Totp;
    }
}
