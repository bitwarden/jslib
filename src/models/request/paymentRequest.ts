import { OrganizationTaxInfoUpdateRequest } from '../request/organizationTaxInfoUpdateRequest';
import { PaymentMethodType } from '../../enums/paymentMethodType';

export class PaymentRequest extends OrganizationTaxInfoUpdateRequest {
    paymentMethodType: PaymentMethodType;
    paymentToken: string;
}
