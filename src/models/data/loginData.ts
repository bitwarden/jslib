import { LoginApi } from '../api/loginApi';
import { LoginUriApi } from '../api/loginUriApi';

import { LoginUriData } from './loginUriData';

export class LoginData {
    uris: LoginUriData[];
    username: string;
    password: string;
    totp: string;

    constructor(data: LoginApi) {
        this.username = data.username;
        this.password = data.password;
        this.totp = data.totp;

        if (data.uris) {
            this.uris = [];
            data.uris.forEach((u) => {
                this.uris.push(new LoginUriData(u));
            });
        }
    }
}
