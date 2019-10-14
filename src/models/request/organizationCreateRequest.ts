import { PaymentMethodType } from '../../enums/paymentMethodType';
import { PlanType } from '../../enums/planType';

export class OrganizationCreateRequest {
    name: string;
    businessName: string;
    billingEmail: string;
    planType: PlanType;
    key: string;
    paymentMethodType: PaymentMethodType;
    paymentToken: string;
    additionalSeats: number;
    additionalStorageGb: number;
    premiumAccessAddon: boolean;
    collectionName: string;
}
