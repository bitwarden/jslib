import { PaymentMethodType } from '../../enums/paymentMethodType';
import { TransactionType } from '../../enums/transactionType';

export class BillingResponse {
    balance: number;
    paymentSource: BillingSourceResponse;
    invoices: BillingInvoiceResponse[] = [];
    transactions: BillingTransactionResponse[] = [];

    constructor(response: any) {
        this.balance = response.Balance;
        this.paymentSource = response.PaymentSource == null ? null : new BillingSourceResponse(response.PaymentSource);
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
