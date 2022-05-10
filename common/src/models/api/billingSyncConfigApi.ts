import { BaseResponse } from "../response/baseResponse";

export class BillingSyncConfigApi extends BaseResponse {
  billingSyncKey: string;

  constructor(data: any) {
    super(data);
    if (data == null) {
      return;
    }
    this.billingSyncKey = this.getResponseProperty("BillingSyncKey");
  }
}
