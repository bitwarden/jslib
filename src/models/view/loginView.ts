import { View } from './view';

import { Login } from '../domain/login';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class LoginView implements View {
    uri: string;
    username: string;
    password: string;
    maskedPassword: string;
    totp: string;

    // tslint:disable-next-line
    private _domain: string;

    constructor(l?: Login) {
        // ctor
    }

    get domain(): string {
        if (this._domain == null && this.uri != null) {
            const containerService = (window as any).bitwardenContainerService;
            if (containerService) {
                const platformUtilsService: PlatformUtilsService = containerService.getPlatformUtilsService();
                this._domain = platformUtilsService.getDomain(this.uri);
            } else {
                throw new Error('window.bitwardenContainerService not initialized.');
            }
        }

        return this._domain;
    }
}
