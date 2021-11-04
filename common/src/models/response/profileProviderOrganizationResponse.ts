import { ProfileOrganizationResponse } from './profileOrganizationResponse';

export class ProfileProviderOrganizationResponse extends ProfileOrganizationResponse {
    constructor(response: any) {
        super(response);
        this.usesKeyConnector = false;
    }
}
