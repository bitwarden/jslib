import { BaseImporter } from "../baseImporter";
import { Importer } from "../importer";

import { ImportResult } from "../../models/domain/importResult";

import { CardView } from "../../models/view/cardView";
import { CipherView } from "../../models/view/cipherView";
import { IdentityView } from "../../models/view/identityView";
import { PasswordHistoryView } from "../../models/view/passwordHistoryView";

import { CipherType } from "../../enums/cipherType";
import { FieldType } from "../../enums/fieldType";

import {
  ExportData,
  AccountsEntity,
  AcctountAttributes,
  VaultsEntity,
  VaultAttributes,
  ItemCollection,
  Item,
  Details,
  LoginFieldTypeEnum,
  LoginFieldsEntity,
  SectionsEntity,
  FieldsEntity,
  Value,
  Address,
  InputTraits,
  PasswordHistoryEntity,
  DocumentAttributes,
  Overview,
  UrlsEntity,
} from "./types/onepassword1PuxImporterTypes";
import { CipherRepromptType } from "../../enums/cipherRepromptType";
import { LoginView } from "../../models/view/loginView";

export class OnePassword1PuxImporter extends BaseImporter implements Importer {
  result = new ImportResult();

  parse(data: string): Promise<ImportResult> {
    const exportData: ExportData = JSON.parse(data);

    const account = exportData.accounts[0];
    // TODO Add handling of multiple vaults
    // const personalVaults = account.vaults[0].filter((v) => v.attrs.type === VaultAttributeTypeEnum.Personal);
    account.vaults.forEach((vault: VaultsEntity) => {
      vault.items.forEach((itemCollection: ItemCollection) => {
        const item: Item = itemCollection.item;
        if (item.trashed === true) {
          return;
        }

        const cipher = this.initLoginCipher();

        switch (item.categoryUuid) {
          case "001": // Login
          case "101": // Bank accounts?
          case "102": // DB credentials
          case "110": // custom login
            cipher.type = CipherType.Login;
            cipher.login = new LoginView();
            break;
          case "002": // CreditCards
            cipher.type = CipherType.Card;
            cipher.card = new CardView();
            break;
          case "003":
            cipher.type = CipherType.SecureNote;
            break;
          case "004":
          case "103": // Drivers license
            cipher.type = CipherType.Identity;
            cipher.identity = new IdentityView();
            break;
          // case "006": // Attachment?
          default:
            break;
        }

        this.processVaultItem(item, cipher);

        this.convertToNoteIfNeeded(cipher);
        this.cleanupCipher(cipher);
        this.result.ciphers.push(cipher);
      });
    });

    if (this.organization) {
      this.moveFoldersToCollections(this.result);
    }

    this.result.success = true;
    return Promise.resolve(this.result);
  }

  private processVaultItem(item: Item, cipher: CipherView) {
    cipher.favorite = item.favIndex === 1 ? true : false;

    this.processOverview(item.overview, cipher);

    this.processLoginFields(item, cipher);

    this.parsePasswordHistory(item.details.passwordHistory, cipher);

    this.processSections(item.details.sections, cipher);

    if (!this.isNullOrWhitespace(item.details.notesPlain)) {
      cipher.notes = item.details.notesPlain.split(this.newLineRegex).join("\n") + "\n";
    }
  }

  private processOverview(overview: Overview, cipher: CipherView) {
    if (overview == null) {
      return;
    }

    cipher.name = this.getValueOrDefault(overview.title);

    if (overview.urls != null) {
      const urls: string[] = [];
      overview.urls.forEach((url: UrlsEntity) => {
        if (!this.isNullOrWhitespace(url.url)) {
          urls.push(url.url);
        }
      });
      cipher.login.uris = this.makeUriArray(urls);
    }

    if (overview.tags != null && overview.tags.length > 0) {
      const folderName = this.capitalize(overview.tags[0]);
      this.processFolder(this.result, folderName);
    }
  }

  private capitalize(string: string) {
    return string.trim().replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
  }

  private processLoginFields(item: Item, cipher: CipherView) {
    if (item.details == null) {
      return;
    }

    if (item.details.loginFields == null || item.details.loginFields.length === 0) {
      return;
    }

    item.details.loginFields.forEach((loginField) => {
      if (loginField.designation == "username" && loginField.value != "") {
        cipher.type = CipherType.Login;
        cipher.login.username = loginField.value;
      } else if (loginField.designation == "password" && loginField.value != "") {
        cipher.type = CipherType.Login;
        cipher.login.password = loginField.value;
      } else {
        let fieldValue = loginField.value;
        let fieldType: FieldType = FieldType.Text;
        switch (loginField.fieldType) {
          case LoginFieldTypeEnum.Password:
            fieldType = FieldType.Hidden;
            break;
          case LoginFieldTypeEnum.CheckBox:
            fieldValue = loginField.value !== "" ? "true" : "false";
            fieldType = FieldType.Boolean;
            break;
          default:
            break;
        }
        this.processKvp(cipher, loginField.name, fieldValue, fieldType);
      }
    });
  }

  private processSections(sections: SectionsEntity[], cipher: CipherView) {
    if (sections == null || sections.length === 0) {
      return;
    }

    sections.forEach((section: SectionsEntity) => {
      if (section.fields != null) {
        this.parseSectionFields(section.fields, cipher);
      }
    });
  }

  private parseSectionFields(fields: FieldsEntity[], cipher: CipherView) {
    fields.forEach((field: FieldsEntity) => {
      const valueKey = Object.keys(field.value)[0];
      const anyField = field as any;

      if (
        anyField.value == null ||
        anyField.value[valueKey] == null ||
        anyField.value[valueKey] === ""
      ) {
        return;
      }

      const fieldName = this.getFieldName(field.id, field.title);
      const fieldValue = this.extractValue(field.value, valueKey);

      if (cipher.type === CipherType.Login) {
        if (this.isNullOrWhitespace(cipher.login.username) && fieldName === "username") {
          cipher.login.username = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(cipher.login.password) && fieldName === "password") {
          cipher.login.password = fieldValue;
          return;
        } else if (
          this.isNullOrWhitespace(cipher.login.totp) &&
          field.id != null &&
          field.id.startsWith("TOTP_")
        ) {
          cipher.login.totp = fieldValue;
          return;
        }
      } else if (cipher.type === CipherType.Card) {
        if (this.isNullOrWhitespace(cipher.card.number) && field.id === "ccnum") {
          cipher.card.number = fieldValue;
          cipher.card.brand = this.getCardBrand(fieldValue);
          return;
        } else if (this.isNullOrWhitespace(cipher.card.code) && field.id === "cvv") {
          cipher.card.code = fieldValue;
          return;
        } else if (
          this.isNullOrWhitespace(cipher.card.cardholderName) &&
          field.id === "cardholder"
        ) {
          cipher.card.cardholderName = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(cipher.card.expiration) && field.id === "expiry") {
          const monthYear: string = fieldValue.toString().trim();
          cipher.card.expMonth = monthYear.substring(4, 6);
          if (cipher.card.expMonth[0] === "0") {
            cipher.card.expMonth = cipher.card.expMonth.substring(1, 2);
          }
          cipher.card.expYear = monthYear.substring(0, 4);
          return;
        } else if (field.id === "type") {
          // Skip since brand was determined from number above
          return;
        }
      } else if (cipher.type === CipherType.Identity) {
        const identity = cipher.identity;
        if (this.isNullOrWhitespace(identity.firstName) && field.id === "firstname") {
          identity.firstName = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(identity.lastName) && field.id === "lastname") {
          identity.lastName = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(identity.middleName) && field.id === "initial") {
          identity.middleName = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(identity.phone) && field.id === "defphone") {
          identity.phone = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(identity.company) && field.id === "company") {
          identity.company = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(identity.email) && field.id === "email") {
          identity.email = fieldValue;
          return;
        } else if (this.isNullOrWhitespace(identity.username) && field.id === "username") {
          identity.username = fieldValue;
          return;
        } else if (valueKey === "address") {
          // fieldValue is an object casted into a string, so access the plain value instead
          const { street, city, country, zip, state } = field.value.address;
          identity.address1 = this.getValueOrDefault(street);
          identity.city = this.getValueOrDefault(city);
          if (!this.isNullOrWhitespace(country)) {
            identity.country = country.toUpperCase();
          }
          identity.postalCode = this.getValueOrDefault(zip);
          identity.state = this.getValueOrDefault(state);
          return;
        }
      }

      // Do not include a password field if it's already in the history
      if (
        field.title === "password" &&
        cipher.passwordHistory != null &&
        cipher.passwordHistory.some((h) => h.password === fieldValue)
      ) {
        return;
      }

      // TODO ?? If one of the fields is marked as guarded, then activate Password-Reprompt for the entire item
      if (field.guarded && cipher.reprompt === CipherRepromptType.None) {
        cipher.reprompt = CipherRepromptType.Password;
      }

      const fieldType = valueKey === "concealed" ? FieldType.Hidden : FieldType.Text;
      this.processKvp(cipher, fieldName, fieldValue, fieldType);
    });
  }

  private getFieldName(id: string, title: string): string {
    if (this.isNullOrWhitespace(title)) {
      return id;
    }

    // Naive approach of checking if the fields id is usable
    if (id.length > 25 && RegExp(/[0-9]{2}[A-Z]{2}/, "i").test(id)) {
      return title;
    }
    return id;
  }

  // totp?: string | null;
  // date?: number | null;
  // string?: string | null;
  // concealed?: string | null;
  // email?: string | null;
  // phone?: string | null;
  // menu?: string | null;
  // gender?: string | null;
  // monthYear?: number | null;
  // url?: string | null;
  // address?: Address | null;
  // creditCardType?: string | null;
  // creditCardNumber?: string | null;
  // reference?: string | null;
  private extractValue(value: Value, valueKey: string): string {
    if (valueKey === "date") {
      return new Date(value.date * 1000).toUTCString();
    }

    if (valueKey === "monthYear") {
      return value.monthYear.toString();
    }

    return (value as any)[valueKey];
  }

  private parsePasswordHistory(historyItems: PasswordHistoryEntity[], cipher: CipherView) {
    if (historyItems == null || historyItems.length === 0) {
      return;
    }

    const maxSize = historyItems.length > 5 ? 5 : historyItems.length;
    cipher.passwordHistory = historyItems
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
}
