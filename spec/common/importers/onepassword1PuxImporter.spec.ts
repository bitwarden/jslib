import { FieldType } from "jslib-common/enums/fieldType";

import { FieldView } from "jslib-common/models/view/fieldView";

import { Utils } from "jslib-common/misc/utils";

import { OnePassword1PuxImporter as Importer } from "jslib-common/importers/onepasswordImporters/onepassword1PuxImporter";

import { OnePuxExampleFile } from "./testData/onePassword1Pux/1pux_example";
import { CreditCardData } from "./testData/onePassword1Pux/CreditCard";
import { IdentityData } from "./testData/onePassword1Pux/IdentityData";
import { LoginData } from "./testData/onePassword1Pux/LoginData";
import { SanitizedExport } from "./testData/onePassword1Pux/SanitizedExport";
import { SecureNoteData } from "./testData/onePassword1Pux/SecureNote";

function validateCustomField(fields: FieldView[], fieldName: string, expectedValue: any) {
  expect(fields).toBeDefined();
  const customField = fields.find((f) => f.name === fieldName);
  expect(customField).withContext(`CustomField: ('${fieldName}') was not found`).toBeDefined();

  expect(customField.value)
    .withContext(`Customfield: ('${fieldName}'), should be equal to: '${expectedValue}'`)
    .toEqual(expectedValue);
}

describe("1Password 1Pux Importer", async () => {
  const OnePuxExampleFileJson = JSON.stringify(OnePuxExampleFile);
  const LoginDataJson = JSON.stringify(LoginData);
  const CreditCardDataJson = JSON.stringify(CreditCardData);
  const IdentityDataJson = JSON.stringify(IdentityData);
  const SecureNoteDataJson = JSON.stringify(SecureNoteData);
  const SanitizedExportJson = JSON.stringify(SanitizedExport);

  it("should parse login data", async () => {
    const importer = new Importer();
    const result = await importer.parse(OnePuxExampleFileJson);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();
    expect(cipher.name).toEqual("Dropbox");
    expect(cipher.login.password).toEqual("most-secure-password-ever!");
    expect(cipher.login.uris.length).toEqual(1);
    const uriView = cipher.login.uris.shift();
    expect(uriView.uri).toEqual("https://www.dropbox.com/");
  });

  it("should parse notes", async () => {
    const importer = new Importer();
    const result = await importer.parse(OnePuxExampleFileJson);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();
    expect(cipher.notes).toEqual("This is a note. *bold*! _italic_!");
  });

  it("should set favourite if favIndex equals 1", async () => {
    const importer = new Importer();
    const result = await importer.parse(OnePuxExampleFileJson);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();
    expect(cipher.favorite).toBeTrue();
  });

  it("should handle custom boolean fields", async () => {
    const importer = new Importer();
    const result = await importer.parse(LoginDataJson);
    expect(result != null).toBe(true);

    const ciphers = result.ciphers;
    expect(ciphers.length).toEqual(1);

    const cipher = ciphers.shift();
    expect(cipher.fields[0].name).toEqual("terms");
    expect(cipher.fields[0].value).toEqual("false");
    expect(cipher.fields[0].type).toBe(FieldType.Boolean);

    expect(cipher.fields[1].name).toEqual("policies");
    expect(cipher.fields[1].value).toEqual("true");
    expect(cipher.fields[1].type).toBe(FieldType.Boolean);
  });

  it('should create concealed field as "hidden" type', async () => {
    const importer = new Importer();
    const result = await importer.parse(OnePuxExampleFileJson);
    expect(result != null).toBe(true);

    const ciphers = result.ciphers;
    expect(ciphers.length).toEqual(1);

    const cipher = ciphers.shift();
    const fields = cipher.fields;
    expect(fields.length).toEqual(1);

    const field = fields.shift();
    expect(field.name).toEqual("PIN");
    expect(field.value).toEqual("12345");
    expect(field.type).toEqual(FieldType.Hidden);
  });

  it("should create password history", async () => {
    const importer = new Importer();
    const result = await importer.parse(OnePuxExampleFileJson);
    const cipher = result.ciphers.shift();

    expect(cipher.passwordHistory.length).toEqual(1);
    const ph = cipher.passwordHistory.shift();
    expect(ph.password).toEqual("12345password");
    expect(ph.lastUsedDate.toISOString()).toEqual("2016-03-18T17:32:35.000Z");
  });

  it("should create credit card records", async () => {
    const importer = new Importer();
    const result = await importer.parse(CreditCardDataJson);
    expect(result != null).toBe(true);
    const cipher = result.ciphers.shift();
    expect(cipher.name).toEqual("Parent's Credit Card");
    expect(cipher.notes).toEqual("My parents' credit card.");

    const card = cipher.card;
    expect(card.cardholderName).toEqual("Fred Engels");
    expect(card.number).toEqual("6011111111111117");
    expect(card.code).toEqual("1312");
    expect(card.brand).toEqual("Discover");
    expect(card.expMonth).toEqual("12");
    expect(card.expYear).toEqual("2099");

    // remaining fields as custom fields
    expect(cipher.fields.length).toEqual(12);
    validateCustomField(cipher.fields, "txbzvwzpck7ejhfres3733rbpm", "card");
    validateCustomField(cipher.fields, "cashLimit", "$500");
    validateCustomField(cipher.fields, "creditLimit", "$1312");
    validateCustomField(cipher.fields, "validFrom", "200101");
    validateCustomField(cipher.fields, "bank", "Some bank");
    validateCustomField(cipher.fields, "phoneLocal", "123456");
    validateCustomField(cipher.fields, "phoneTollFree", "0800123456");
    validateCustomField(cipher.fields, "phoneIntl", "+49123456");
    validateCustomField(cipher.fields, "website", "somebank.com");
    validateCustomField(cipher.fields, "pin", "1234");
    validateCustomField(cipher.fields, "interest", "1%");
    validateCustomField(cipher.fields, "issuenumber", "123456");
  });

  it("should create identity records", async () => {
    const importer = new Importer();
    const result = await importer.parse(IdentityDataJson);
    expect(result != null).toBe(true);
    const cipher = result.ciphers.shift();
    expect(cipher.name).toEqual("George Engels");

    const identity = cipher.identity;
    expect(identity.firstName).toEqual("George");
    expect(identity.middleName).toEqual("S");
    expect(identity.lastName).toEqual("Engels");
    expect(identity.company).toEqual("Acme Inc.");
    expect(identity.address1).toEqual("1312 Main St.");
    expect(identity.country).toEqual("US");
    expect(identity.state).toEqual("California");
    expect(identity.city).toEqual("Atlantis");
    expect(identity.postalCode).toEqual("90210");
    expect(identity.phone).toEqual("4565555555");
    expect(identity.email).toEqual("gengels@nullvalue.test");
    expect(identity.username).toEqual("gengels");

    // remaining fields as custom fields
    expect(cipher.fields.length).toEqual(17);
    validateCustomField(cipher.fields, "sex", "male");
    validateCustomField(cipher.fields, "birthdate", "Thu, 01 Jan 1981 12:01:00 GMT");
    validateCustomField(cipher.fields, "occupation", "Steel Worker");
    validateCustomField(cipher.fields, "department", "QA");
    validateCustomField(cipher.fields, "jobtitle", "Quality Assurance Manager");
    validateCustomField(cipher.fields, "homephone", "4575555555");
    validateCustomField(cipher.fields, "cellphone", "4585555555");
    validateCustomField(cipher.fields, "busphone", "4595555555");
    validateCustomField(cipher.fields, "reminderq", "Who's a super cool guy?");
    validateCustomField(cipher.fields, "remindera", "Me, buddy.");
    validateCustomField(cipher.fields, "website", "cv.gengels.nullvalue.test");
    validateCustomField(cipher.fields, "icq", "12345678");
    validateCustomField(cipher.fields, "skype", "skypeisbad1619");
    validateCustomField(cipher.fields, "aim", "aollol@lololol.aol.com");
    validateCustomField(cipher.fields, "yahoo", "sk8rboi13@yah00.com");
    validateCustomField(cipher.fields, "msn", "msnothankyou@msn&m&m.com");
    validateCustomField(cipher.fields, "forumsig", "super cool guy");
  });

  it("should create secure notes", async () => {
    const importer = new Importer();
    const result = await importer.parse(SecureNoteDataJson);
    expect(result != null).toBe(true);
    const cipher = result.ciphers.shift();
    expect(cipher.name).toEqual("Secure Note #1");
    expect(cipher.notes).toEqual(
      "This is my secure note. Lorem ipsum expecto patronum. The quick brown fox jumped over the lazy dog."
    );
  });

  it("should create folders", async () => {
    const importer = new Importer();
    const result = await importer.parse(SanitizedExportJson);
    expect(result != null).toBe(true);

    const folders = result.folders;
    expect(folders.length).toBe(5);
    expect(folders[0].name).toBe("Movies");
    expect(folders[1].name).toBe("Finance");
    expect(folders[2].name).toBe("Travel");
    expect(folders[3].name).toBe("Education");
    expect(folders[4].name).toBe("Starter Kit");

    // Check that ciphers have a folder assigned to them
    expect(result.ciphers.filter((c) => c.folderId === folders[0].id).length).toBeGreaterThan(0);
    expect(result.ciphers.filter((c) => c.folderId === folders[1].id).length).toBeGreaterThan(0);
    expect(result.ciphers.filter((c) => c.folderId === folders[2].id).length).toBeGreaterThan(0);
    expect(result.ciphers.filter((c) => c.folderId === folders[3].id).length).toBeGreaterThan(0);
    expect(result.ciphers.filter((c) => c.folderId === folders[4].id).length).toBeGreaterThan(0);
  });

  it("should create collections if part of an organization", async () => {
    const importer = new Importer();
    importer.organizationId = Utils.newGuid();
    const result = await importer.parse(SanitizedExportJson);
    expect(result != null).toBe(true);

    const collections = result.collections;
    expect(collections.length).toBe(5);
    expect(collections[0].name).toBe("Movies");
    expect(collections[1].name).toBe("Finance");
    expect(collections[2].name).toBe("Travel");
    expect(collections[3].name).toBe("Education");
    expect(collections[4].name).toBe("Starter Kit");
  });
});
