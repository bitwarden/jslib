import {
    BillingChargeResponse,
    BillingInvoiceResponse,
    BillingSourceResponse,
    BillingSubscriptionResponse,
} from './billingResponse';
import { OrganizationResponse } from './organizationResponse';

export class OrganizationBillingResponse extends OrganizationResponse {
    storageName: string;
    storageGb: number;
    paymentSource: BillingSourceResponse;
    subscription: BillingSubscriptionResponse;
    upcomingInvoice: BillingInvoiceResponse;
    charges: BillingChargeResponse[] = [];
    expiration: Date;

    constructor(response: any) {
        super(response);
        this.storageName = response.StorageName;
        this.storageGb = response.StorageGb;
        this.paymentSource = response.PaymentSource == null ? null : new BillingSourceResponse(response.PaymentSource);
        this.subscription = response.Subscription == null ?
            null : new BillingSubscriptionResponse(response.Subscription);
        this.upcomingInvoice = response.UpcomingInvoice == null ?
            null : new BillingInvoiceResponse(response.UpcomingInvoice);
        if (response.Charges != null) {
            this.charges = response.Charges.map((c: any) => new BillingChargeResponse(c));
        }
        this.expiration = response.Expiration != null ? new Date(response.Expiration) : null;
    }
}
