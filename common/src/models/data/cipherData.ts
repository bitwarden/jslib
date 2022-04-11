import { CipherRepromptType } from "../../enums/cipherRepromptType";
import { CipherType } from "../../enums/cipherType";
import { Cipher } from "../domain/cipher";
import { EncString } from "../domain/encString";
import { CipherResponse } from "../response/cipherResponse";

import { AttachmentData } from "./attachmentData";
import { CardData } from "./cardData";
import { FieldData } from "./fieldData";
import { IdentityData } from "./identityData";
import { LoginData } from "./loginData";
import { PasswordHistoryData } from "./passwordHistoryData";
import { SecureNoteData } from "./secureNoteData";

export class CipherData {
  id: string;
  organizationId: string;
  folderId: string;
  userId: string;
  edit: boolean;
  viewPassword: boolean;
  organizationUseTotp: boolean;
  favorite: boolean;
  revisionDate: string;
  type: CipherType;
  sizeName: string;
  name: string;
  notes: string;
  login?: LoginData;
  secureNote?: SecureNoteData;
  card?: CardData;
  identity?: IdentityData;
  fields?: FieldData[];
  attachments?: AttachmentData[];
  passwordHistory?: PasswordHistoryData[];
  collectionIds?: string[];
  deletedDate: string;
  reprompt: CipherRepromptType;

  constructor(response?: CipherResponse, userId?: string, collectionIds?: string[]) {
    if (response == null) {
      return;
    }

    this.id = response.id;
    this.organizationId = response.organizationId;
    this.folderId = response.folderId;
    this.userId = userId;
    this.edit = response.edit;
    this.viewPassword = response.viewPassword;
    this.organizationUseTotp = response.organizationUseTotp;
    this.favorite = response.favorite;
    this.revisionDate = response.revisionDate;
    this.type = response.type;
    this.name = response.name;
    this.notes = response.notes;
    this.collectionIds = collectionIds != null ? collectionIds : response.collectionIds;
    this.deletedDate = response.deletedDate;
    this.reprompt = response.reprompt;

    switch (this.type) {
      case CipherType.Login:
        this.login = new LoginData(response.login);
        break;
      case CipherType.SecureNote:
        this.secureNote = new SecureNoteData(response.secureNote);
        break;
      case CipherType.Card:
        this.card = new CardData(response.card);
        break;
      case CipherType.Identity:
        this.identity = new IdentityData(response.identity);
        break;
      default:
        break;
    }

    if (response.fields != null) {
      this.fields = response.fields.map((f) => new FieldData(f));
    }
    if (response.attachments != null) {
      this.attachments = response.attachments.map((a) => new AttachmentData(a));
    }
    if (response.passwordHistory != null) {
      this.passwordHistory = response.passwordHistory.map((ph) => new PasswordHistoryData(ph));
    }
  }

  private toEncString(val: string) {
    return val ? new EncString(val) : null;
  }

  toCipher(localData?: any) {
    const cipher = new Cipher();
    cipher.id = this.id;
    cipher.organizationId = this.organizationId;
    cipher.folderId = this.folderId;
    cipher.name = this.toEncString(this.name);
    cipher.notes = this.toEncString(this.notes);

    cipher.type = this.type;
    cipher.favorite = this.favorite;
    cipher.organizationUseTotp = this.organizationUseTotp;
    cipher.edit = this.edit;

    cipher.viewPassword = this.viewPassword ?? true; // Default for already synced Ciphers without viewPassword

    cipher.revisionDate = this.revisionDate != null ? new Date(this.revisionDate) : null;
    cipher.collectionIds = this.collectionIds;
    cipher.localData = localData;
    cipher.deletedDate = this.deletedDate != null ? new Date(this.deletedDate) : null;
    cipher.reprompt = this.reprompt;

    switch (this.type) {
      case CipherType.Login:
        //cipher.login = new Login(obj.login, alreadyEncrypted);
        break;
      case CipherType.SecureNote:
        //cipher.secureNote = new SecureNote(obj.secureNote);
        break;
      case CipherType.Card:
        //cipher.card = new Card(obj.card, alreadyEncrypted);
        break;
      case CipherType.Identity:
        //cipher.identity = new Identity(obj.identity, alreadyEncrypted);
        break;
      default:
        break;
    }

    if (this.attachments != null) {
      //cipher.attachments = this.attachments.map((a) => new Attachment(a, alreadyEncrypted));
    } else {
      cipher.attachments = null;
    }

    if (this.fields != null) {
      //cipher.fields = this.fields.map((f) => new Field(f, alreadyEncrypted));
    } else {
      cipher.fields = null;
    }

    if (this.passwordHistory != null) {
      //cipher.passwordHistory = this.passwordHistory.map((ph) => new Password(ph, alreadyEncrypted));
    } else {
      cipher.passwordHistory = null;
    }
  }
}
