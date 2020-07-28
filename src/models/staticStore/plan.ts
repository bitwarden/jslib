import { PlanType } from "../../enums/planType";
import { ProductType } from "../../enums/productType";

export class Plan {
    type: PlanType;
    productType: ProductType;
    name: string;
    description: string;
    canBeUsedByBusiness: boolean;
    basSeats: number;
    baseStorageGb: number;
    maxCollections: number;

    hasAdditionalSeatsOption: boolean;
    maxAdditionalSeats: number;
    hasAdditionStorageOption: boolean;
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
    isLegacy: boolean;
    disabled: boolean;

    stripePlanId: string;
    stripeSeatPlanId: string;
    stripeStoragePlanId: string;
    stripePremiumAccessPlanId: string;
    basePrice: number;
    seatPrice: number;
    additionalStoragePricePerGb: number;
    premiumAccessOptionCose: number;
}
