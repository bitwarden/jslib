import { PlanType } from '../../enums/planType';

export class OrganizationUpgradeRequest {
    businessName: string;
    planType: PlanType;
    additionalSeats: number;
    additionalStorageGb: number;
    premiumAccessAddon: boolean;
}
