import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { DeviceRequest } from './deviceRequest';

export class TokenRequest {
    email: string;
    masterPasswordHash: string;
    token: string;
    provider: TwoFactorProviderType;
    remember: boolean;
    device?: DeviceRequest;

    constructor(email: string, masterPasswordHash: string, provider: TwoFactorProviderType,
        token: string, remember: boolean, device?: DeviceRequest) {
        this.email = email;
        this.masterPasswordHash = masterPasswordHash;
        this.token = token;
        this.provider = provider;
        this.remember = remember;
        this.device = device != null ? device : null;
    }

    toIdentityToken(clientId: string) {
        const obj: any = {
            grant_type: 'password',
            username: this.email,
            password: this.masterPasswordHash,
            scope: 'api offline_access',
            client_id: clientId,
        };

        if (this.device) {
            obj.deviceType = this.device.type;
            obj.deviceIdentifier = this.device.identifier;
            obj.deviceName = this.device.name;
            // no push tokens for browser apps yet
            // obj.devicePushToken = this.device.pushToken;
        }

        if (this.token && this.provider != null) {
            obj.twoFactorToken = this.token;
            obj.twoFactorProvider = this.provider;
            obj.twoFactorRemember = this.remember ? '1' : '0';
        }

        return obj;
    }
}
