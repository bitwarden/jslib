import {
    BillingChargeResponse,
    BillingInvoiceInfoResponse,
    BillingInvoiceResponse,
    BillingSourceResponse,
    BillingSubscriptionResponse,
    BillingTransactionResponse,
} from './billingResponse';
import { OrganizationResponse } from './organizationResponse';

export class OrganizationBillingResponse extends OrganizationResponse {
    storageName: string;
    storageGb: number;
    paymentSource: BillingSourceResponse;
    subscription: BillingSubscriptionResponse;
    upcomingInvoice: BillingInvoiceInfoResponse;
    charges: BillingChargeResponse[] = [];
    invoices: BillingInvoiceResponse[] = [];
    transactions: BillingTransactionResponse[] = [];
    expiration: string;

    constructor(response: any) {
        super(response);
        this.storageName = response.StorageName;
        this.storageGb = response.StorageGb;
        this.paymentSource = response.PaymentSource == null ? null : new BillingSourceResponse(response.PaymentSource);
        this.subscription = response.Subscription == null ?
            null : new BillingSubscriptionResponse(response.Subscription);
        this.upcomingInvoice = response.UpcomingInvoice == null ?
            null : new BillingInvoiceInfoResponse(response.UpcomingInvoice);
        if (response.Charges != null) {
            this.charges = response.Charges.map((c: any) => new BillingChargeResponse(c));
        }
        if (response.Transactions != null) {
            this.transactions = response.Transactions.map((t: any) => new BillingTransactionResponse(t));
        }
        if (response.Invoices != null) {
            this.invoices = response.Invoices.map((i: any) => new BillingInvoiceResponse(i));
        }
        this.expiration = response.Expiration;
    }
}
