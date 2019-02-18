import { PaymentMethodType } from '../../enums/paymentMethodType';
import { TransactionType } from '../../enums/transactionType';

export class BillingResponse {
    paymentSource: BillingSourceResponse;
    charges: BillingChargeResponse[] = [];
    invoices: BillingInvoiceResponse[] = [];
    transactions: BillingTransactionResponse[] = [];

    constructor(response: any) {
        this.paymentSource = response.PaymentSource == null ? null : new BillingSourceResponse(response.PaymentSource);
        if (response.Charges != null) {
            this.charges = response.Charges.map((c: any) => new BillingChargeResponse(c));
        }
        if (response.Transactions != null) {
            this.transactions = response.Transactions.map((t: any) => new BillingTransactionResponse(t));
        }
        if (response.Invoices != null) {
            this.invoices = response.Invoices.map((i: any) => new BillingInvoiceResponse(i));
        }
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

export class BillingInvoiceResponse {
    url: string;
    pdfUrl: string;
    number: string;
    paid: boolean;
    date: string;
    amount: number;

    constructor(response: any) {
        this.url = response.Url;
        this.pdfUrl = response.PdfUrl;
        this.number = response.Number;
        this.paid = response.Paid;
        this.date = response.Date;
        this.amount = response.Amount;
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
