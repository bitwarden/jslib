import { BaseResponse } from "./baseResponse";

export class SsoPreValidateResponse extends BaseResponse {
  token: string;

  constructor(response: any) {
    super(response);
    this.token = this.getResponseProperty("Token");
  }
}
