import { BaseResponse } from "./baseResponse";
import { BillingSourceResponse } from "./billingResponse";

export class BillingPaymentResponse extends BaseResponse {
  balance: number;
  paymentSource: BillingSourceResponse;

  constructor(response: any) {
    super(response);
    this.balance = this.getResponseProperty("Balance");
    const paymentSource = this.getResponseProperty("PaymentSource");
    this.paymentSource = paymentSource == null ? null : new BillingSourceResponse(paymentSource);
  }
}
