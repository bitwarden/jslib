import { PaymentMethodType } from '../../enums/paymentMethodType';

export class PaymentRequest {
    paymentMethodType: PaymentMethodType;
    paymentToken: string;
}
