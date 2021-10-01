import { BaseResponse } from '../baseResponse';

export class OrganizationSsoResponse extends BaseResponse {
    enabled: boolean;
    data: any;
    urls: SsoUrls;

    constructor(response: any) {
        super(response);
        this.enabled = this.getResponseProperty('Enabled');
        this.data = this.getResponseProperty('Data');
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
