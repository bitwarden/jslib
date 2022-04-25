import { EncString } from "jslib-common/models/domain/encString";

export interface Folder {
  id: string;
  name: EncString;
  revisionDate: Date;
}
