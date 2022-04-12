import { BaseResponse } from "./baseResponse";

export class OrganizationSponsorshipSyncStatusResponse extends BaseResponse {
  lastSyncDate?: Date;

  constructor(response: any) {
    super(response);
    const lastSyncDate = this.getResponseProperty("LastSyncDate");
    if (lastSyncDate) {
      this.lastSyncDate = new Date(lastSyncDate);
    }
  }
}
