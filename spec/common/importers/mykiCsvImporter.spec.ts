import { CipherType } from "jslib-common/enums/cipherType";
import { MykiCsvImporter as Importer } from "jslib-common/importers/mykiCsvImporter";

import { userAccountData } from "./testData/mykiCsv/UserAccount.csv";
import { userCreditCardData } from "./testData/mykiCsv/UserCreditCard.csv";
import { userIdentityData } from "./testData/mykiCsv/UserIdentity.csv";
import { userNoteData } from "./testData/mykiCsv/UserNote.csv";
import { userTwoFaData } from "./testData/mykiCsv/UserTwofa.csv";

describe("Myki CSV Importer", () => {
  let importer: Importer;
  beforeEach(() => {
    importer = new Importer();
  });

  it("should parse userAccount records", async () => {
    const result = await importer.parse(userAccountData);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();

    expect(cipher.name).toEqual("PasswordNickname");
    expect(cipher.login.username).toEqual("user.name@email.com");
    expect(cipher.login.password).toEqual("abc123");
    expect(cipher.login.totp).toEqual("someTOTPSeed");
    expect(cipher.login.uris.length).toEqual(1);
    const uriView = cipher.login.uris.shift();
    expect(uriView.uri).toEqual("http://www.google.com");
    expect(cipher.notes).toEqual("This is the additional information text.");

    expect(cipher.fields.length).toBe(2);

    expect(cipher.fields[0].name).toBe("status");
    expect(cipher.fields[0].value).toBe("active");

    expect(cipher.fields[1].name).toBe("tags");
    expect(cipher.fields[1].value).toBe("someTag");
  });

  it("should parse userTwoFa records", async () => {
    const result = await importer.parse(userTwoFaData);
    expect(result != null).toBe(true);

    const cipher = result.ciphers.shift();

    expect(cipher.name).toEqual("2FA nickname");
    expect(cipher.login.username).toBeNull();
    expect(cipher.login.password).toBeNull();
    expect(cipher.login.totp).toBe("someTOTPSeed");
    expect(cipher.notes).toEqual("Additional information field content.");

    expect(cipher.fields.length).toBe(2);

    expect(cipher.fields[0].name).toBe("status");
    expect(cipher.fields[0].value).toBe("active");

    expect(cipher.fields[1].name).toBe("tags");
    expect(cipher.fields[1].value).toBe("someTag");
  });

  it("should parse creditCard records", async () => {
    const result = await importer.parse(userCreditCardData);

    expect(result).not.toBeNull();
    expect(result.success).toBe(true);
    expect(result.ciphers.length).toBe(1);

    const cipher = result.ciphers.shift();
    expect(cipher.type).toBe(CipherType.Card);
    expect(cipher.name).toBe("Visa test card");
    expect(cipher.card.brand).toBe("Visa");
    expect(cipher.card.cardholderName).toBe("Joe User");
    expect(cipher.card.number).toBe("4111111111111111");
    expect(cipher.card.code).toBe("222");
    expect(cipher.card.expMonth).toBe("04");
    expect(cipher.card.expYear).toBe("24");

    expect(cipher.notes).toBe("This is the additional information field");

    expect(cipher.fields.length).toBe(2);

    expect(cipher.fields[0].name).toBe("status");
    expect(cipher.fields[0].value).toBe("active");

    expect(cipher.fields[1].name).toBe("tags");
    expect(cipher.fields[1].value).toBe("someTag");
  });

  it("should parse identity records", async () => {
    const result = await importer.parse(userIdentityData);

    expect(result).not.toBeNull();
    expect(result.success).toBe(true);

    const cipher = result.ciphers.shift();
    expect(cipher.type).toBe(CipherType.Identity);
    expect(cipher.name).toBe("Joe User's nickname");
    expect(cipher.identity.fullName).toBe("Mr Joe M User");
    expect(cipher.identity.title).toBe("Mr");
    expect(cipher.identity.firstName).toBe("Joe");
    expect(cipher.identity.middleName).toBe("M");
    expect(cipher.identity.lastName).toBe("User");
    expect(cipher.identity.email).toBe("joe.user@email.com");

    expect(cipher.identity.address1).toBe("1 Example House");
    expect(cipher.identity.address2).toBe("Suite 300");

    expect(cipher.identity.city).toBe("Portland");
    expect(cipher.identity.postalCode).toBe("04101");
    expect(cipher.identity.country).toBe("United States");

    expect(cipher.fields.length).toBe(4);

    expect(cipher.fields[0].name).toEqual("status");
    expect(cipher.fields[0].value).toEqual("active");

    expect(cipher.fields[1].name).toBe("tags");
    expect(cipher.fields[1].value).toBe("someTag");

    expect(cipher.fields[2].name).toEqual("gender");
    expect(cipher.fields[2].value).toEqual("Male");

    expect(cipher.fields[3].name).toEqual("number");
    expect(cipher.fields[3].value).toEqual("2223334444");
  });

  it("should parse secureNote records", async () => {
    const result = await importer.parse(userNoteData);

    expect(result).not.toBeNull();
    expect(result.success).toBe(true);
    expect(result.ciphers.length).toBe(1);

    const cipher = result.ciphers.shift();
    expect(cipher.type).toBe(CipherType.SecureNote);
    expect(cipher.name).toBe("The title of a secure note");
    expect(cipher.notes).toBe("The content of a secure note. Lorem ipsum, etc.");

    expect(cipher.fields.length).toBe(1);

    expect(cipher.fields[0].name).toBe("status");
    expect(cipher.fields[0].value).toBe("active");
  });
});
