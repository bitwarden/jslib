import { CipherRepromptType } from "jslib-common/enums/cipherRepromptType";
import { CipherType } from "jslib-common/enums/cipherType";
import { FieldType } from "jslib-common/enums/fieldType";

import { Attachment } from "./attachment";
import { EncObject } from "./encObject";

// TODO: We need some way to migrate between versions
// and ensure the data sent to the server does not match the latest version
// since we might want to ensure backwards compatability.
// If the client retrieves a version > known, display an error

// Upgrade this whenever the data model changes.
export const CIPHER_LATEST_VERSION = 1;

/**
 * New Cipher Model, replaces Cipher.
 */
export interface Cipher2 {
  version: number;

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
