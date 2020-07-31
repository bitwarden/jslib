import { PlanType } from '../../enums/planType';
import { ProductType } from '../../enums/productType';

export class Plan {
    type: PlanType;
    product: ProductType;
    name: string;
    isAnnual: boolean;
    i18nNameItem: string;
    i18nDescriptionItem: string;
    canBeUsedByBusiness: boolean;
    baseSeats: number;
    baseStorageGb: number;
    maxCollections: number;
    maxUsers: number;

    hasAdditionalSeatsOption: boolean;
    maxAdditionalSeats: number;
    hasAdditionalStorageOption: boolean;
    maxAdditionalStorage: number;
    hasPremiumAccessOption: boolean;
    trialPeriodDays: number;

    hasSelfHost: boolean;
    hasPolicies: boolean;
    hasGroups: boolean;
    hasDirectory: boolean;
    hasEvents: boolean;
    hasTotp: boolean;
    has2fa: boolean;
    hasApi: boolean;
    hasSso: boolean;
    usersGetPremium: boolean;

    sortOrder: number;
    legacyYear: number;
    disabled: boolean;

    stripePlanId: string;
    stripeSeatPlanId: string;
    stripeStoragePlanId: string;
    stripePremiumAccessPlanId: string;
    basePrice: number;
    seatPrice: number;
    additionalStoragePricePerGb: number;
    premiumAccessOptionPrice: number;
}
