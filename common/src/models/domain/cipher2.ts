import { CipherRepromptType } from "jslib-common/enums/cipherRepromptType";
import { CipherType } from "jslib-common/enums/cipherType";
import { FieldType } from "jslib-common/enums/fieldType";

import { Attachment } from "./attachment";
import { EncObject } from "./encObject";

/**
 * New Cipher Model, replaces Cipher.
 */
export interface Cipher2 {
  id: string;
  organizationId: string;
  type: CipherType;
  data: EncObject<CipherDetails>;
  favorite: boolean;
  folderId: string;
  attachments: Attachment[];
  organizationUseTotp: boolean;
  edit: boolean;
  viewPassword: boolean;
  revisionDate: Date;
  localData: any;
  collectionIds: string[];
  deletedDate: Date;
  reprompt: CipherRepromptType;
}

export interface CipherDetails {
  name: string;
  fields: CipherField[];
}

export interface CipherField {
  name: string;
  displayName: string;
  type: FieldType;
  value: string | boolean;
}
