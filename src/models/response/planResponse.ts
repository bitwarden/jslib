import { BaseResponse } from './baseResponse';
import { PlanType } from '../../enums/planType';
import { ProductType } from '../../enums/productType';

export class PlanResponse extends BaseResponse {
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

    constructor(response: any) {
        super(response);
        this.type = this.getResponseProperty('type');
        this.product = this.getResponseProperty('product');
        this.name = this.getResponseProperty('name');
        this.isAnnual = this.getResponseProperty('isAnnual');
        this.i18nNameItem = this.getResponseProperty('i18nNameItem');
        this.i18nDescriptionItem = this.getResponseProperty('i18nDescriptionItem');
        this.canBeUsedByBusiness = this.getResponseProperty('canBeUsedByBusiness');
        this.baseSeats = this.getResponseProperty('baseSeats');
        this.baseStorageGb = this.getResponseProperty('baseStorageGb');
        this.maxCollections = this.getResponseProperty('maxCollections');
        this.maxUsers = this.getResponseProperty('maxUsers');
        this.hasAdditionalSeatsOption = this.getResponseProperty('hasAdditionalSeatsOption');
        this.maxAdditionalSeats = this.getResponseProperty('maxAdditionalSeats');
        this.hasAdditionalStorageOption = this.getResponseProperty('hasAdditionalStorageOption');
        this.maxAdditionalStorage = this.getResponseProperty('maxAdditionalStorage');
        this.hasPremiumAccessOption = this.getResponseProperty('hasPremiumAccessOption');
        this.trialPeriodDays = this.getResponseProperty('trialPeriodDays');
        this.hasSelfHost = this.getResponseProperty('hasSelfHost');
        this.hasPolicies = this.getResponseProperty('hasPolicies');
        this.hasGroups = this.getResponseProperty('hasGroups');
        this.hasDirectory = this.getResponseProperty('hasDirectory');
        this.hasEvents = this.getResponseProperty('hasEvents');
        this.hasTotp = this.getResponseProperty('hasTotp');
        this.has2fa = this.getResponseProperty('has2fa');
        this.hasApi = this.getResponseProperty('hasApi');
        this.hasSso = this.getResponseProperty('hasSso');
        this.usersGetPremium = this.getResponseProperty('usersGetPremium');
        this.sortOrder = this.getResponseProperty('sortOrder');
        this.legacyYear = this.getResponseProperty('legacyYear');
        this.disabled = this.getResponseProperty('disabled');
        this.stripePlanId = this.getResponseProperty('stripePlanId');
        this.stripeSeatPlanId = this.getResponseProperty('stripeSeatPlanId');
        this.stripeStoragePlanId = this.getResponseProperty('stripeStoragePlanId');
        this.stripePremiumAccessPlanId = this.getResponseProperty('stripePremiumAccessPlanId');
        this.basePrice = this.getResponseProperty('basePrice');
        this.seatPrice = this.getResponseProperty('seatPrice');
        this.additionalStoragePricePerGb = this.getResponseProperty('additionalStoragePricePerGb');
        this.premiumAccessOptionPrice = this.getResponseProperty('premiumAccessOptionPrice');
    }
}
