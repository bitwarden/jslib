import Substitute, { Arg, SubstituteOf } from "@fluffy-spoon/substitute";

import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { ImportService } from "jslib-common/abstractions/import.service";

import { BitwardenPasswordProtectedImporter } from "jslib-common/importers/bitwardenPasswordProtectedImporter";
import { Importer } from "jslib-common/importers/importer";

import { Utils } from "jslib-common/misc/utils";
import { ImportResult } from "jslib-common/models/domain/importResult";

describe("BitwardenPasswordProtectedImporter", () => {
  let importer: BitwardenPasswordProtectedImporter;
  let innerImporter: SubstituteOf<Importer>;
  let importService: SubstituteOf<ImportService>;
  let cryptoService: SubstituteOf<CryptoService>;
  let i18nService: SubstituteOf<I18nService>;
  const password = Utils.newGuid();
  const result = new ImportResult();
  let jDoc: {
    encrypted?: boolean;
    passwordProtected?: boolean;
    format?: string;
    salt?: string;
    kdfIterations?: any;
    encKeyValidation_DO_NOT_EDIT?: string;
    data?: string;
  };

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    i18nService = Substitute.for<I18nService>();
    importService = Substitute.for<ImportService>();
    innerImporter = Substitute.for<Importer>();

    jDoc = {
      encrypted: true,
      passwordProtected: true,
      format: "csv",
      salt: "c2FsdA==",
      kdfIterations: 100000,
      encKeyValidation_DO_NOT_EDIT: Utils.newGuid(),
      data: Utils.newGuid(),
    };

    result.success = true;
    innerImporter.parse(Arg.any()).resolves(result);
    importer = new BitwardenPasswordProtectedImporter(
      importService,
      cryptoService,
      i18nService,
      password
    );
  });

  describe("Required Json Data", () => {
    it("succeeds with default jdoc", async () => {
      cryptoService.decryptToUtf8(Arg.any(), Arg.any()).resolves("successful decryption");

      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(true);
    });

    it("accepts json format", async () => {
      jDoc.format = "json";
      cryptoService.decryptToUtf8(Arg.any(), Arg.any()).resolves("successful decryption");

      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(true);
    });

    it("accepts encrypted_json format", async () => {
      jDoc.format = "encrypted_json";
      cryptoService.decryptToUtf8(Arg.any(), Arg.any()).resolves("successful decryption");

      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(true);
    });

    it("fails if encrypted === false", async () => {
      jDoc.encrypted = false;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if encrypted === null", async () => {
      jDoc.encrypted = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if passwordProtected === false", async () => {
      jDoc.passwordProtected = false;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if passwordProtected === null", async () => {
      jDoc.passwordProtected = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if format === null", async () => {
      jDoc.format = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if format not known", async () => {
      jDoc.format = "Not a real format";
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if salt === null", async () => {
      jDoc.salt = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if kdfIterations === null", async () => {
      jDoc.kdfIterations = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if kdfIterations is not a number", async () => {
      jDoc.kdfIterations = "not a number";
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if encKeyValidation_DO_NOT_EDIT === null", async () => {
      jDoc.encKeyValidation_DO_NOT_EDIT = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("fails if data === null", async () => {
      jDoc.data = null;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });
  });

  describe("inner importer", () => {
    beforeEach(() => {
      cryptoService.decryptToUtf8(Arg.any(), Arg.any()).resolves("successful decryption");
    });
    it("delegates success", async () => {
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(true);
      result.success = false;
      expect((await importer.parse(JSON.stringify(jDoc))).success).toEqual(false);
    });

    it("passes on organization Id", async () => {
      jDoc.format = "csv";
      importer.organizationId = Utils.newGuid();
      await importer.parse(JSON.stringify(jDoc));

      importService.received(1).getImporter("bitwardencsv", importer.organizationId);
    });

    it("passes null organizationId if none set", async () => {
      jDoc.format = "csv";
      importer.organizationId = null;
      await importer.parse(JSON.stringify(jDoc));

      importService.received(1).getImporter("bitwardencsv", null);
    });

    it("gets csv importer for csv format", async () => {
      jDoc.format = "csv";

      await importer.parse(JSON.stringify(jDoc));

      importService.received(1).getImporter("bitwardencsv", Arg.any());
    });

    it("gets json importer for json format", async () => {
      jDoc.format = "json";

      await importer.parse(JSON.stringify(jDoc));

      importService.received(1).getImporter("bitwardenjson", Arg.any());
    });

    it("gets json importer for encrypted_json format", async () => {
      jDoc.format = "encrypted_json";

      await importer.parse(JSON.stringify(jDoc));

      importService.received(1).getImporter("bitwardenjson", Arg.any());
    });
  });
});
