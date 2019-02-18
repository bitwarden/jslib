import { OrganizationResponse } from './organizationResponse';
import {
    BillingSubscriptionResponse,
    BillingSubscriptionUpcomingInvoiceResponse,
} from './subscriptionResponse';

export class OrganizationSubscriptionResponse extends OrganizationResponse {
    storageName: string;
    storageGb: number;
    subscription: BillingSubscriptionResponse;
    upcomingInvoice: BillingSubscriptionUpcomingInvoiceResponse;
    expiration: string;

    constructor(response: any) {
        super(response);
        this.storageName = response.StorageName;
        this.storageGb = response.StorageGb;
        this.subscription = response.Subscription == null ?
            null : new BillingSubscriptionResponse(response.Subscription);
        this.upcomingInvoice = response.UpcomingInvoice == null ?
            null : new BillingSubscriptionUpcomingInvoiceResponse(response.UpcomingInvoice);
        this.expiration = response.Expiration;
    }
}
