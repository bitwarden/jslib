import { Utils } from '../../misc/utils';
import { BaseResponse } from './baseResponse';

export class TwoFactorU2fResponse extends BaseResponse {
    enabled: boolean;
    keys: KeyResponse[];

    constructor(response: any) {
        super(response);
        this.enabled = this.getResponseProperty('Enabled');
        const keys = this.getResponseProperty('Keys');
        this.keys = keys == null ? null : keys.map((k: any) => new KeyResponse(k));
    }
}

export class KeyResponse extends BaseResponse {
    name: string;
    id: number;
    compromised: boolean;

    constructor(response: any) {
        super(response);
        this.name = this.getResponseProperty('Name');
        this.id = this.getResponseProperty('Id');
        this.compromised = this.getResponseProperty('Compromised');
    }
}

export class ChallengeResponse extends BaseResponse implements PublicKeyCredentialCreationOptions {
    attestation?: AttestationConveyancePreference;
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    challenge: BufferSource;
    excludeCredentials?: PublicKeyCredentialDescriptor[];
    extensions?: AuthenticationExtensionsClientInputs;
    pubKeyCredParams: PublicKeyCredentialParameters[];
    rp: PublicKeyCredentialRpEntity;
    timeout?: number;
    user: PublicKeyCredentialUserEntity;

    constructor(response: any) {
        super(response);
        this.attestation = this.getResponseProperty('attestation');
        this.authenticatorSelection = this.getResponseProperty('authenticatorSelection');
        this.challenge = new Buffer(this.getResponseProperty('challenge'), 'base64');
        this.excludeCredentials = this.getResponseProperty('excludeCredentials').map((c: any) => {
            const base64 = c.id.replace(/-/g, '+').replace(/_/g, '/');
            c.id = Utils.fromB64ToArray(base64).buffer;
            return c;
        });
        this.extensions = this.getResponseProperty('extensions');
        this.pubKeyCredParams = this.getResponseProperty('pubKeyCredParams');
        this.rp = this.getResponseProperty('rp');
        this.timeout = this.getResponseProperty('timeout');

        const user = this.getResponseProperty('user');
        user.id = new Buffer(user.id, 'base64');

        this.user = user;
    }
}
