import { SsoConfigApi } from '../../api/ssoConfigApi';
import { BaseResponse } from '../baseResponse';

export class OrganizationSsoResponse extends BaseResponse {
    enabled: boolean;
    data: SsoConfigApi;
    urls: SsoUrls;

    constructor(response: any) {
        super(response);
        this.enabled = this.getResponseProperty('Enabled');
        this.data = new SsoConfigApi(this.getResponseProperty('Data'));
        this.urls = this.getResponseProperty('Urls');
    }
}

type SsoUrls = {
    callbackPath: string;
    signedOutCallbackPath: string;
    spEntityId: string;
    spMetadataUrl: string;
    spAcsUrl: string;
};
