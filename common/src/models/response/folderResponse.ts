import { EncString } from "../domain/encString";
import { Folder } from "../domain/folder";

import { BaseResponse } from "./baseResponse";

export class FolderResponse extends BaseResponse {
  id: string;
  name: string;
  revisionDate: string;

  constructor(response: any) {
    super(response);
    this.id = this.getResponseProperty("Id");
    this.name = this.getResponseProperty("Name");
    this.revisionDate = this.getResponseProperty("RevisionDate");
  }

  toFolder(): Folder {
    return {
      id: this.id,
      name: new EncString(this.name),
      revisionDate: new Date(this.revisionDate),
    };
  }
}
