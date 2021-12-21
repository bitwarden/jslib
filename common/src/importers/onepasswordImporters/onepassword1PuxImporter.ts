import { BaseImporter } from "../baseImporter";
import { Importer } from "../importer";

import { ImportResult } from "../../models/domain/importResult";

import { CardView } from "../../models/view/cardView";
import { CipherView } from "../../models/view/cipherView";
import { IdentityView } from "../../models/view/identityView";
import { PasswordHistoryView } from "../../models/view/passwordHistoryView";
import { SecureNoteView } from "../../models/view/secureNoteView";

import { CipherType } from "../../enums/cipherType";
import { FieldType } from "../../enums/fieldType";
import { SecureNoteType } from "../../enums/secureNoteType";

type ExportAttributes = {
  version: string;
  description: string;
  createdAt: string;
};

type AccountAttributes = {
  accountName: string;
  name: string;
  avatar: string;
  email: string;
  uuid: string;
  domain: string;
};

type Account = {
  attrs: AccountAttributes;
};

enum VaultAttributeTypeEnum {
  Personal = "P",
  Everyone = "E",
  UserCreated = "U",
}

type VaultAttributes = {
  uuid: string;
  desc: string;
  avatar: string;
  name: string;
  type: VaultAttributeTypeEnum;
};

interface VaultItem {
  uuid: string;
  favIndex: number;
  createdAt: number;
  updatedAt: number;
  trashed: boolean;
  categoryUuid: string;
  details: ItemDetails;
  notesPlain: string;
  sections: Section[];
  passwordHistory: PasswordHistory[];
  overview: ItemOverview;
}

interface ItemDetails {
  loginFields: LoginField[];
  notesPlain: string;
  sections: Section[];
  passwordHistory: PasswordHistory[];
}

interface LoginField {
  value: string;
  id: string;
  name: string;
  fieldType: string;
  designation: string;
}

interface PasswordHistory {
  value: string;
  time: number;
}

interface Section {
  title: string;
  name: string;
  fields: Field[];
}

interface Field {
  title: string;
  id: string;
  value: Value;
  indexAtSource: number;
  guarded: boolean;
  multiline: boolean;
  dontGenerate: boolean;
  inputTraits: InputTraits;
}

interface InputTraits {
  keyboard: string;
  correction: string;
  capitalization: string;
}

interface Value {
  concealed: string;
}

interface ItemOverview {
  subtitle: string;
  urls: URL[];
  title: string;
  url: string;
  ps: number;
  pbe: number;
  pgrng: boolean;
}

interface URL {
  label: string;
  url: string;
}

type Vault = {
  attrs: VaultAttributes;
  items: VaultItem[];
};

type ExportData = {
  accounts: Account[];
  vaults: Vault[];
  createdAt: string;
};

export class OnePassword1PuxImporter extends BaseImporter implements Importer {
  result = new ImportResult();

  parse(data: string): Promise<ImportResult> {
    const exportData: ExportData = JSON.parse(data);
    // const personalVaults = exportData.vaults[0].filter((v) => v.attrs.type === VaultAttributeTypeEnum.Personal);
    const personalVaults = [exportData.vaults[0]];
    personalVaults.forEach((vault) => {
      vault.items.forEach((item) => {
        if (item.trashed === true) {
          return;
        }

        const cipher = this.initLoginCipher();

        this.processVaultItem(item, cipher);

        this.convertToNoteIfNeeded(cipher);
        this.cleanupCipher(cipher);
        this.result.ciphers.push(cipher);
      });
    });

    this.result.success = true;
    return Promise.resolve(this.result);
  }

  private processVaultItem(item: VaultItem, cipher: CipherView) {
    cipher.favorite = item.favIndex === 1 ? true : false;

    this.processOverview(item, cipher);

    if (item.details.loginFields != null) {
      this.processLoginFields(item, cipher);
    }

    if (item.details.sections != null) {
      this.processSections(item.details.sections, cipher);
    }

    if (item.details.passwordHistory != null) {
      this.parsePasswordHistory(item.details.passwordHistory, cipher);
    }

    // if (!this.isNullOrWhitespace(item.details.ccnum) || !this.isNullOrWhitespace(item.details.cvv)) {
    //   cipher.type = CipherType.Card;
    //   cipher.card = new CardView();
    // } else if (!this.isNullOrWhitespace(item.details.firstname) || !this.isNullOrWhitespace(item.details.address1)) {
    //   cipher.type = CipherType.Identity;
    //   cipher.identity = new IdentityView();
    // }

    // if (cipher.type === CipherType.Login && !this.isNullOrWhitespace(item.details.password)) {
    //   cipher.login.password = item.details. .password;
    // }

    if (!this.isNullOrWhitespace(item.details.notesPlain)) {
      cipher.notes = item.details.notesPlain.split(this.newLineRegex).join("\n") + "\n";
    }
    // if (item.details.loginFields != null) {
    //   this.parseFields(item.details.loginFields, cipher, "designation", "value", "name");
    // }
  }

  private processOverview(item: VaultItem, cipher: CipherView) {
    if (item.overview == null) {
      return;
    }

    cipher.name = this.getValueOrDefault(item.overview.title);

    if (item.overview.urls != null) {
      const urls: string[] = [];
      item.overview.urls.forEach((url: URL) => {
        if (!this.isNullOrWhitespace(url.url)) {
          urls.push(url.url);
        }
      });
      cipher.login.uris = this.makeUriArray(urls);
    }
  }

  private processLoginFields(item: VaultItem, cipher: CipherView) {
    if (item.details.loginFields == null) {
      return;
    }

    if (item.details.loginFields.length == 0) {
      return;
    }

    item.details.loginFields.forEach((loginField) => {
      if (
        (loginField.fieldType == "T" || loginField.designation == "username") &&
        loginField.value != ""
      ) {
        cipher.type = CipherType.Login;
        cipher.login.username = loginField.value;
      } else if (
        (loginField.fieldType == "P" || loginField.designation == "password") &&
        loginField.value != ""
      ) {
        cipher.type = CipherType.Login;
        cipher.login.password = loginField.value;
      }
    });
  }

  private processSections(sections: Section[], cipher: CipherView) {
    if (sections == null) {
      return;
    }

    // sections.forEach((section: Section) => {
    //   if (section.fields != null) {
    //     this.parseFields(section.fields, cipher, "n", "v", "t");
    //   }
    // });
  }

  private parsePasswordHistory(items: PasswordHistory[], cipher: CipherView) {
    const maxSize = items.length > 5 ? 5 : items.length;
    cipher.passwordHistory = items
      .filter((h: any) => !this.isNullOrWhitespace(h.value) && h.time != null)
      .sort((a, b) => b.time - a.time)
      .slice(0, maxSize)
      .map((h: any) => {
        const ph = new PasswordHistoryView();
        ph.password = h.value;
        ph.lastUsedDate = new Date(("" + h.time).length >= 13 ? h.time : h.time * 1000);
        return ph;
      });
  }

  // private parseFields(
  //   fields: Field[],
  //   cipher: CipherView,
  //   designationKey: string,
  //   valueKey: string,
  //   nameKey: string
  // ) {
  //   fields.forEach((field: Field) => {
  //     if (field[valueKey] == null || field[valueKey].toString().trim() === "") {
  //       return;
  //     }

  //     // TODO: when date FieldType exists, store this as a date field type instead of formatted Text if k is 'date'
  //     const fieldValue =
  //       field.k === "date"
  //         ? new Date(field[valueKey] * 1000).toUTCString()
  //         : field[valueKey].toString();
  //     const fieldDesignation =
  //       field[designationKey] != null ? field[designationKey].toString() : null;

  //     if (cipher.type === CipherType.Login) {
  //       if (this.isNullOrWhitespace(cipher.login.username) && fieldDesignation === "username") {
  //         cipher.login.username = fieldValue;
  //         return;
  //       } else if (
  //         this.isNullOrWhitespace(cipher.login.password) &&
  //         fieldDesignation === "password"
  //       ) {
  //         cipher.login.password = fieldValue;
  //         return;
  //       } else if (
  //         this.isNullOrWhitespace(cipher.login.totp) &&
  //         fieldDesignation != null &&
  //         fieldDesignation.startsWith("TOTP_")
  //       ) {
  //         cipher.login.totp = fieldValue;
  //         return;
  //       }
  //     } else if (cipher.type === CipherType.Card) {
  //       if (this.isNullOrWhitespace(cipher.card.number) && fieldDesignation === "ccnum") {
  //         cipher.card.number = fieldValue;
  //         cipher.card.brand = this.getCardBrand(fieldValue);
  //         return;
  //       } else if (this.isNullOrWhitespace(cipher.card.code) && fieldDesignation === "cvv") {
  //         cipher.card.code = fieldValue;
  //         return;
  //       } else if (
  //         this.isNullOrWhitespace(cipher.card.cardholderName) &&
  //         fieldDesignation === "cardholder"
  //       ) {
  //         cipher.card.cardholderName = fieldValue;
  //         return;
  //       } else if (
  //         this.isNullOrWhitespace(cipher.card.expiration) &&
  //         fieldDesignation === "expiry" &&
  //         fieldValue.length === 6
  //       ) {
  //         cipher.card.expMonth = (fieldValue as string).substr(4, 2);
  //         if (cipher.card.expMonth[0] === "0") {
  //           cipher.card.expMonth = cipher.card.expMonth.substr(1, 1);
  //         }
  //         cipher.card.expYear = (fieldValue as string).substr(0, 4);
  //         return;
  //       } else if (fieldDesignation === "type") {
  //         // Skip since brand was determined from number above
  //         return;
  //       }
  //     } else if (cipher.type === CipherType.Identity) {
  //       const identity = cipher.identity;
  //       if (this.isNullOrWhitespace(identity.firstName) && fieldDesignation === "firstname") {
  //         identity.firstName = fieldValue;
  //         return;
  //       } else if (this.isNullOrWhitespace(identity.lastName) && fieldDesignation === "lastname") {
  //         identity.lastName = fieldValue;
  //         return;
  //       } else if (this.isNullOrWhitespace(identity.middleName) && fieldDesignation === "initial") {
  //         identity.middleName = fieldValue;
  //         return;
  //       } else if (this.isNullOrWhitespace(identity.phone) && fieldDesignation === "defphone") {
  //         identity.phone = fieldValue;
  //         return;
  //       } else if (this.isNullOrWhitespace(identity.company) && fieldDesignation === "company") {
  //         identity.company = fieldValue;
  //         return;
  //       } else if (this.isNullOrWhitespace(identity.email) && fieldDesignation === "email") {
  //         identity.email = fieldValue;
  //         return;
  //       } else if (this.isNullOrWhitespace(identity.username) && fieldDesignation === "username") {
  //         identity.username = fieldValue;
  //         return;
  //       } else if (fieldDesignation === "address") {
  //         // fieldValue is an object casted into a string, so access the plain value instead
  //         const { street, city, country, zip } = field[valueKey];
  //         identity.address1 = this.getValueOrDefault(street);
  //         identity.city = this.getValueOrDefault(city);
  //         if (!this.isNullOrWhitespace(country)) {
  //           identity.country = country.toUpperCase();
  //         }
  //         identity.postalCode = this.getValueOrDefault(zip);
  //         return;
  //       }
  //     }

  //     const fieldName = this.isNullOrWhitespace(field[nameKey]) ? "no_name" : field[nameKey];
  //     if (
  //       fieldName === "password" &&
  //       cipher.passwordHistory != null &&
  //       cipher.passwordHistory.some((h) => h.password === fieldValue)
  //     ) {
  //       return;
  //     }

  //     const fieldType = field.guarded === true ? FieldType.Hidden : FieldType.Text;
  //     this.processKvp(cipher, fieldName, fieldValue, fieldType);
  //   });
  // }
}
