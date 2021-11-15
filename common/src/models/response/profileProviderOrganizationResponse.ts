import { ProfileOrganizationResponse } from './profileOrganizationResponse';

export class ProfileProviderOrganizationResponse extends ProfileOrganizationResponse {
    constructor(response: any) {
        super(response);
        this.familySponsorshipFriendlyName = this.getResponseProperty('FamilySponsorshipFriendlyName');
        this.familySponsorshipAvailable = this.getResponseProperty('FamilySponsorshipAvailable');
        this.planProductType = this.getResponseProperty('PlanProductType');
        this.usesKeyConnector = false;
    }
}
