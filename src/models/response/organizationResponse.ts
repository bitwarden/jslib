import { PlanType } from '../../enums/planType';

export class OrganizationResponse {
    id: string;
    name: string;
    businessName: string;
    businessAddress1: string;
    businessAddress2: string;
    businessAddress3: string;
    businessCountry: string;
    businessTaxNumber: string;
    billingEmail: string;
    plan: string;
    planType: PlanType;
    seats: number;
    maxCollections: number;
    maxStorageGb: number;
    useGroups: boolean;
    useDirectory: boolean;
    useEvents: boolean;
    useTotp: boolean;
    use2fa: boolean;

    constructor(response: any) {
        this.id = response.Id;
        this.name = response.Name;
        this.businessName = response.BusinessName;
        this.businessAddress1 = response.BusinessAddress1;
        this.businessAddress2 = response.BusinessAddress2;
        this.businessAddress3 = response.BusinessAddress3;
        this.businessCountry = response.BusinessCountry;
        this.businessTaxNumber = response.BusinessTaxNumber;
        this.billingEmail = response.BillingEmail;
        this.plan = response.Plan;
        this.planType = response.PlanType;
        this.seats = response.Seats;
        this.maxCollections = response.MaxCollections;
        this.maxStorageGb = response.MaxStorageGb;
        this.useGroups = response.UseGroups;
        this.useDirectory = response.UseDirectory;
        this.useEvents = response.UseEvents;
        this.useTotp = response.UseTotp;
        this.use2fa = response.Use2fa;
    }
}
