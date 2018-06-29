import { PaymentMethodType } from '../../enums/paymentMethodType';

export class BillingResponse {
    storageName: string;
    storageGb: number;
    maxStorageGb: number;

    constructor(response: any) {
        this.storageName = response.StorageName;
        this.storageGb = response.StorageGb;
        this.maxStorageGb = response.MaxStorageGb;
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
    trialStartDate: Date;
    trialEndDate: Date;
    periodStartDate: Date;
    periodEndDate: Date;
    cancelledDate: Date;
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
            this.items = response.Items.map((i) => new BillingSubscriptionItemResponse(i));
        }
    }
}

export class BillingSubscriptionItemResponse {
    name: string;
    amount: number;
    quantity: number;
    internal: string;

    constructor(response: any) {
        this.name = response.Name;
        this.amount = response.Amount;
        this.quantity = response.Quantity;
        this.internal = response.Internal;
    }
}

export class BillingInvoiceResponse {
    date: Date;
    amount: number;

    constructor(response: any) {
        this.date = response.Date;
        this.amount = response.Amount;
    }
}

export class BillingChargeResponse {
    createdDate: Date;
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
