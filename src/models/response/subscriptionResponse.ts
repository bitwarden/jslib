export class SubscriptionResponse {
    storageName: string;
    storageGb: number;
    maxStorageGb: number;
    subscription: BillingSubscriptionResponse;
    upcomingInvoice: BillingSubscriptionUpcomingInvoiceResponse;
    license: any;
    expiration: string;

    constructor(response: any) {
        this.storageName = response.StorageName;
        this.storageGb = response.StorageGb;
        this.maxStorageGb = response.MaxStorageGb;
        this.subscription = response.Subscription == null ?
            null : new BillingSubscriptionResponse(response.Subscription);
        this.upcomingInvoice = response.UpcomingInvoice == null ?
            null : new BillingSubscriptionUpcomingInvoiceResponse(response.UpcomingInvoice);
        this.license = response.License;
        this.expiration = response.Expiration;
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

export class BillingSubscriptionUpcomingInvoiceResponse {
    date: string;
    amount: number;

    constructor(response: any) {
        this.date = response.Date;
        this.amount = response.Amount;
    }
}
