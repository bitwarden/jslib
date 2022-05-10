import { BaseResponse } from "./baseResponse";

export class ApiKeyResponse extends BaseResponse {
  apiKey: string;
  revisionDate: Date;

  constructor(response: any) {
    super(response);
    this.apiKey = this.getResponseProperty("ApiKey");
    this.revisionDate = new Date(this.getResponseProperty("RevisionDate"));
  }
}
