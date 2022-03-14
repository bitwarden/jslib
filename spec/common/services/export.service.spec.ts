import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";
import { SutProvider } from "spec/utils/sutProvider/sutProvider";

import { CipherService } from "jslib-common/abstractions/cipher.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { CipherType } from "jslib-common/enums/cipherType";
import { KdfType } from "jslib-common/enums/kdfType";
import { Utils } from "jslib-common/misc/utils";
import { Cipher } from "jslib-common/models/domain/cipher";
import { EncString } from "jslib-common/models/domain/encString";
import { Login } from "jslib-common/models/domain/login";
import { CipherWithIds as CipherExport } from "jslib-common/models/export/cipherWithIds";
import { CipherView } from "jslib-common/models/view/cipherView";
import { LoginView } from "jslib-common/models/view/loginView";
import { ExportService } from "jslib-common/services/export.service";

import { BuildTestObject, GetUniqueString } from "../../utils/utils";

const UserCipherViews = [
  generateCipherView(false),
  generateCipherView(false),
  generateCipherView(true),
];

const UserCipherDomains = [
  generateCipherDomain(false),
  generateCipherDomain(false),
  generateCipherDomain(true),
];

function generateCipherView(deleted: boolean) {
  return BuildTestObject(
    {
      id: GetUniqueString("id"),
      notes: GetUniqueString("notes"),
      type: CipherType.Login,
      login: BuildTestObject<LoginView>(
        {
          username: GetUniqueString("username"),
          password: GetUniqueString("password"),
        },
        LoginView
      ),
      collectionIds: null,
      deletedDate: deleted ? new Date() : null,
    },
    CipherView
  );
}

function generateCipherDomain(deleted: boolean) {
  return BuildTestObject(
    {
      id: GetUniqueString("id"),
      notes: new EncString(GetUniqueString("notes")),
      type: CipherType.Login,
      login: BuildTestObject<Login>(
        {
          username: new EncString(GetUniqueString("username")),
          password: new EncString(GetUniqueString("password")),
        },
        Login
      ),
      collectionIds: null,
      deletedDate: deleted ? new Date() : null,
    },
    Cipher
  );
}

function expectEqualCiphers(ciphers: CipherView[] | Cipher[], jsonResult: string) {
  const actual = JSON.stringify(JSON.parse(jsonResult).items);
  const items: CipherExport[] = [];
  ciphers.forEach((c: CipherView | Cipher) => {
    const item = new CipherExport();
    item.build(c);
    items.push(item);
  });

  expect(actual).toEqual(JSON.stringify(items));
}

describe("ExportService", () => {
  let sutProvider: SutProvider<ExportService>;
  let cipherService: SubstituteOf<CipherService>;

  beforeEach(() => {
    sutProvider = new SutProvider(ExportService);
    cipherService = sutProvider.getDependency<CipherService>(CipherService);

    const folderService = sutProvider.getDependency<FolderService>(FolderService);
    folderService.getAllDecrypted().resolves([]);
    folderService.getAll().resolves([]);
  });

  it("exports unecrypted user ciphers", async () => {
    cipherService.getAllDecrypted().resolves(UserCipherViews.slice(0, 1));

    const actual = await sutProvider.sut.getExport("json");

    expectEqualCiphers(UserCipherViews.slice(0, 1), actual);
  });

  it("exports encrypted json user ciphers", async () => {
    cipherService.getAll().resolves(UserCipherDomains.slice(0, 1));

    const actual = await sutProvider.sut.getExport("encrypted_json");

    expectEqualCiphers(UserCipherDomains.slice(0, 1), actual);
  });

  it("does not unecrypted export trashed user items", async () => {
    cipherService.getAllDecrypted().resolves(UserCipherViews);

    const actual = await sutProvider.sut.getExport("json");

    expectEqualCiphers(UserCipherViews.slice(0, 2), actual);
  });

  it("does not encrypted export trashed user items", async () => {
    cipherService.getAll().resolves(UserCipherDomains);

    const actual = await sutProvider.sut.getExport("encrypted_json");

    expectEqualCiphers(UserCipherDomains.slice(0, 2), actual);
  });

  describe("password protected export", () => {
    let exportString: string;
    let exportObject: any;
    let mac: SubstituteOf<EncString>;
    let data: SubstituteOf<EncString>;
    const password = "password";
    const salt = "salt";

    describe("export json object", () => {
      beforeEach(async () => {
        mac = Substitute.for<EncString>();
        data = Substitute.for<EncString>();

        mac.encryptedString = "mac";
        data.encryptedString = "encData";

        spyOn(Utils, "fromBufferToB64").and.returnValue(salt);
        cipherService.getAllDecrypted().resolves(UserCipherViews.slice(0, 1));

        exportString = await sutProvider.sut.getPasswordProtectedExport(password);
        exportObject = JSON.parse(exportString);
      });

      it("specifies it is encrypted", () => {
        expect(exportObject.encrypted).toBe(true);
      });

      it("specifies it's password protected", () => {
        expect(exportObject.passwordProtected).toBe(true);
      });

      it("specifies salt", () => {
        expect(exportObject.salt).toEqual("salt");
      });

      it("specifies kdfIterations", () => {
        expect(exportObject.kdfIterations).toEqual(100000);
      });

      it("has kdfType", () => {
        expect(exportObject.kdfType).toEqual(KdfType.PBKDF2_SHA256);
      });

      it("has a mac property", () => {
        sutProvider
          .getDependency<CryptoService>(CryptoService)
          .encrypt(Arg.any(), Arg.any())
          .resolves(mac);
        expect(exportObject.encKeyValidation_DO_NOT_EDIT).toEqual(mac.encryptedString);
      });

      it("has data property", () => {
        sutProvider
          .getDependency<CryptoService>(CryptoService)
          .encrypt(Arg.any(), Arg.any())
          .resolves(data);
        expect(exportObject.data).toEqual(data.encryptedString);
      });

      it("encrypts the data property", async () => {
        const unencrypted = await sutProvider.sut.getExport();
        expect(exportObject.data).not.toEqual(unencrypted);
      });
    });
  });
});
