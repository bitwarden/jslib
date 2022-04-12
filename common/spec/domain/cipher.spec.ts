import Substitute, { Arg } from "@fluffy-spoon/substitute";

import { CipherRepromptType } from "jslib-common/enums/cipherRepromptType";
import { CipherType } from "jslib-common/enums/cipherType";
import { UriMatchType } from "jslib-common/enums/uriMatchType";
import { CipherData } from "jslib-common/models/data/cipherData";
import { Cipher } from "jslib-common/models/domain/cipher";
import { Login } from "jslib-common/models/domain/login";
import { LoginView } from "jslib-common/models/view/loginView";

import { mockEnc } from "../utils";

describe("Cipher DTO", () => {
  it("Convert from empty CipherData", () => {
    const data = new CipherData();
    const cipher = new Cipher(data);

    expect(cipher).toEqual({
      id: null,
      userId: null,
      organizationId: null,
      folderId: null,
      name: null,
      notes: null,
      type: undefined,
      favorite: undefined,
      organizationUseTotp: undefined,
      edit: undefined,
      viewPassword: true,
      revisionDate: null,
      collectionIds: undefined,
      localData: null,
      deletedDate: null,
      reprompt: undefined,
      attachments: null,
      fields: null,
      passwordHistory: null,
    });
  });

  describe("LoginCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        userId: "userId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Login,
        name: "EncryptedString",
        notes: "EncryptedString",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        login: {
          uris: [{ uri: "EncryptedString", match: UriMatchType.Domain }],
          username: "EncryptedString",
          password: "EncryptedString",
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          totp: "EncryptedString",
          autofillOnPageLoad: false,
        },
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        id: "id",
        userId: "userId",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        deletedDate: null,
        reprompt: 0,
        login: {
          passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
          autofillOnPageLoad: false,
          username: { encryptedString: "EncryptedString", encryptionType: 0 },
          password: { encryptedString: "EncryptedString", encryptionType: 0 },
          totp: { encryptedString: "EncryptedString", encryptionType: 0 },
          uris: [{ match: 0, uri: { encryptedString: "EncryptedString", encryptionType: 0 } }],
        },
        attachments: null,
        fields: null,
        passwordHistory: null,
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData("userId")).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Login;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;

      const loginView = new LoginView();
      loginView.username = "username";
      loginView.password = "password";

      const login = Substitute.for<Login>();
      login.decrypt(Arg.any(), Arg.any()).resolves(loginView);
      cipher.login = login;

      const cipherView = await cipher.decrypt();

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        login: loginView,
        attachments: null,
        fields: null,
        passwordHistory: null,
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
      });

      console.log(cipherView);
    });
  });
});
