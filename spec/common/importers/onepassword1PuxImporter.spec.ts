import { FieldType } from "jslib-common/enums/fieldType";
import { OnePassword1PuxImporter as Importer } from "jslib-common/importers/onepasswordImporters/onepassword1PuxImporter";

import { data as TestData2 } from "./testData/onePassword1Pux/1pux";

describe("1Password 1Pux Importer", () => {
  it("should parse data", async () => {
    const importer = new Importer();
    const result = await importer.parse(TestData2);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();
    expect(cipher.login.username).toEqual("user@test.net");
    expect(cipher.login.password).toEqual("myservicepassword");
    expect(cipher.login.uris.length).toEqual(1);
    const uriView = cipher.login.uris.shift();
    expect(uriView.uri).toEqual("https://www.google.com");
  });

  // it('should create concealed field as "hidden" type', async () => {
  //   const importer = new Importer();
  //   const result = await importer.parse(TestData);
  //   expect(result != null).toBe(true);

  //   const ciphers = result.ciphers;
  //   expect(ciphers.length).toEqual(1);

  //   const cipher = ciphers.shift();
  //   const fields = cipher.fields;
  //   expect(fields.length).toEqual(1);

  //   const field = fields.shift();
  //   expect(field.name).toEqual("console password");
  //   expect(field.value).toEqual("console-password-123");
  //   expect(field.type).toEqual(FieldType.Hidden);
  // });

  // it("should create identity records", async () => {
  //   const importer = new Importer();
  //   const result = await importer.parse(IdentityTestData);
  //   expect(result != null).toBe(true);
  //   const cipher = result.ciphers.shift();
  //   expect(cipher.name).toEqual("Test Identity");

  //   const identity = cipher.identity;
  //   expect(identity.firstName).toEqual("Frank");
  //   expect(identity.middleName).toEqual("MD");
  //   expect(identity.lastName).toEqual("Fritzenberger");
  //   expect(identity.company).toEqual("Web Inc.");
  //   expect(identity.address1).toEqual("Mainstreet 1");
  //   expect(identity.country).toEqual("DE");
  //   expect(identity.city).toEqual("Berlin");
  //   expect(identity.postalCode).toEqual("223344");
  //   expect(identity.phone).toEqual("+49 001 222 333 44");
  //   expect(identity.email).toEqual("test@web.de");

  //   // remaining fields as custom fields
  //   expect(cipher.fields.length).toEqual(6);
  //   const fields = cipher.fields;
  //   expect(fields[0].name).toEqual("sex");
  //   expect(fields[0].value).toEqual("male");
  //   expect(fields[1].name).toEqual("birth date");
  //   expect(fields[1].value).toEqual("Mon, 11 Mar 2019 12:01:00 GMT");
  //   expect(fields[2].name).toEqual("occupation");
  //   expect(fields[2].value).toEqual("Engineer");
  //   expect(fields[3].name).toEqual("department");
  //   expect(fields[3].value).toEqual("IT");
  //   expect(fields[4].name).toEqual("job title");
  //   expect(fields[4].value).toEqual("Developer");
  //   expect(fields[5].name).toEqual("home");
  //   expect(fields[5].value).toEqual("+49 333 222 111");
  // });

  // it("should create password history", async () => {
  //   const importer = new Importer();
  //   const result = await importer.parse(TestData);
  //   const cipher = result.ciphers.shift();

  //   expect(cipher.passwordHistory.length).toEqual(1);
  //   const ph = cipher.passwordHistory.shift();
  //   expect(ph.password).toEqual("old-password");
  //   expect(ph.lastUsedDate.toISOString()).toEqual("2015-11-17T20:17:01.000Z");
  // });

  // it("should create password history from windows opvault 1pif format", async () => {
  //   const importer = new Importer();
  //   const result = await importer.parse(WindowsOpVaultTestData);
  //   const cipher = result.ciphers.shift();

  //   expect(cipher.passwordHistory.length).toEqual(5);
  //   let ph = cipher.passwordHistory.shift();
  //   expect(ph.password).toEqual("oldpass6");
  //   expect(ph.lastUsedDate.toISOString()).toEqual("2019-03-24T02:27:41.000Z");
  //   ph = cipher.passwordHistory.shift();
  //   expect(ph.password).toEqual("oldpass5");
  //   expect(ph.lastUsedDate.toISOString()).toEqual("2019-03-24T02:27:40.000Z");
  //   ph = cipher.passwordHistory.shift();
  //   expect(ph.password).toEqual("oldpass4");
  //   expect(ph.lastUsedDate.toISOString()).toEqual("2019-03-24T02:27:39.000Z");
  //   ph = cipher.passwordHistory.shift();
  //   expect(ph.password).toEqual("oldpass3");
  //   expect(ph.lastUsedDate.toISOString()).toEqual("2019-03-24T02:27:38.000Z");
  //   ph = cipher.passwordHistory.shift();
  //   expect(ph.password).toEqual("oldpass2");
  //   expect(ph.lastUsedDate.toISOString()).toEqual("2019-03-24T02:27:37.000Z");
  // });
});
