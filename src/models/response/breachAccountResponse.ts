export class BreachAccountResponse {
    addedDate: string;
    breachDate: string;
    dataClasses: string[];
    description: string;
    domain: string;
    isActive: boolean;
    isVerified: boolean;
    logoType: string;
    modifiedDate: string;
    name: string;
    pwnCount: number;
    title: string;

    constructor(response: any) {
        this.addedDate = response.AddedDate;
        this.breachDate = response.BreachDate;
        this.dataClasses = response.DataClasses;
        this.description = response.Description;
        this.domain = response.Domain;
        this.isActive = response.IsActive;
        this.isVerified = response.IsVerified;
        this.logoType = response.LogoType;
        this.modifiedDate = response.ModifiedDate;
        this.name = response.Name;
        this.pwnCount = response.PwnCount;
        this.title = response.Title;
    }
}
