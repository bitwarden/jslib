import { PaymentMethodType } from '../../enums/paymentMethodType';
import { TransactionType } from '../../enums/transactionType';

export class BillingResponse {
    storageName: string;
    storageGb: number;
    maxStorageGb: number;
    paymentSource: BillingSourceResponse;
    subscription: BillingSubscriptionResponse;
    upcomingInvoice: BillingInvoiceInfoResponse;
    charges: BillingChargeResponse[] = [];
    invoices: BillingInvoiceResponse[] = [];
    transactions: BillingTransactionResponse[] = [];
    license: any;
    expiration: string;

    constructor(response: any) {
        this.storageName = response.StorageName;
        this.storageGb = response.StorageGb;
        this.maxStorageGb = response.MaxStorageGb;
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
        this.license = response.License;
        this.expiration = response.Expiration;
    }
}

export class BillingSourceResponse {
    type: PaymentMethodType;
    cardBrand: string;
    description: string;
    needsVerification: boolean;

    constructor(response: any) {
        this.type = response.Type;
        this.cardBrand = response.CardBrand;
        this.description = response.Description;
        this.needsVerification = response.NeedsVerification;
    }
}

export class BillingSubscriptionResponse {
    trialStartDate: string;
    trialEndDate: string;
    periodStartDate: string;
    periodEndDate: string;
    cancelledDate: string;
    cancelAtEndDate: boolean;
    status: string;
    cancelled: boolean;
    items: BillingSubscriptionItemResponse[] = [];

    constructor(response: any) {
        this.trialEndDate = response.TrialStartDate;
        this.trialEndDate = response.TrialEndDate;
        this.periodStartDate = response.PeriodStartDate;
        this.periodEndDate = response.PeriodEndDate;
        this.cancelledDate = response.CancelledDate;
        this.cancelAtEndDate = response.CancelAtEndDate;
        this.status = response.Status;
        this.cancelled = response.Cancelled;
        if (response.Items != null) {
            this.items = response.Items.map((i: any) => new BillingSubscriptionItemResponse(i));
        }
    }
}

export class BillingSubscriptionItemResponse {
    name: string;
    amount: number;
    quantity: number;
    interval: string;

    constructor(response: any) {
        this.name = response.Name;
        this.amount = response.Amount;
        this.quantity = response.Quantity;
        this.interval = response.Interval;
    }
}

export class BillingInvoiceInfoResponse {
    date: string;
    amount: number;

    constructor(response: any) {
        this.date = response.Date;
        this.amount = response.Amount;
    }
}

export class BillingChargeResponse {
    createdDate: string;
    amount: number;
    paymentSource: BillingSourceResponse;
    status: string;
    failureMessage: string;
    refunded: boolean;
    partiallyRefunded: boolean;
    refundedAmount: number;
    invoiceId: string;

    constructor(response: any) {
        this.createdDate = response.CreatedDate;
        this.amount = response.Amount;
        this.paymentSource = response.PaymentSource != null ? new BillingSourceResponse(response.PaymentSource) : null;
        this.status = response.Status;
        this.failureMessage = response.FailureMessage;
        this.refunded = response.Refunded;
        this.partiallyRefunded = response.PartiallyRefunded;
        this.refundedAmount = response.RefundedAmount;
        this.invoiceId = response.InvoiceId;
    }
}

export class BillingInvoiceResponse extends BillingInvoiceInfoResponse {
    url: string;
    pdfUrl: string;
    number: string;
    paid: boolean;

    constructor(response: any) {
        super(response);
        this.url = response.Url;
        this.pdfUrl = response.PdfUrl;
        this.number = response.Number;
        this.paid = response.Paid;
    }
}

export class BillingTransactionResponse {
    createdDate: string;
    amount: number;
    refunded: boolean;
    partiallyRefunded: boolean;
    refundedAmount: number;
    type: TransactionType;
    paymentMethodType: PaymentMethodType;
    details: string;

    constructor(response: any) {
        this.createdDate = response.CreatedDate;
        this.amount = response.Amount;
        this.refunded = response.Refunded;
        this.partiallyRefunded = response.PartiallyRefunded;
        this.refundedAmount = response.RefundedAmount;
        this.type = response.Type;
        this.paymentMethodType = response.PaymentMethodType;
        this.details = response.Details;
    }
}
