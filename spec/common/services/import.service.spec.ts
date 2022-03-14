import { SutProvider } from "spec/utils/sutProvider/sutProvider";

import { BitwardenPasswordProtectedImporter } from "jslib-common/importers/bitwardenPasswordProtectedImporter";
import { Importer } from "jslib-common/importers/importer";
import { Utils } from "jslib-common/misc/utils";
import { ImportService } from "jslib-common/services/import.service";

describe("ImportService", () => {
  let sutProvider: SutProvider<ImportService>;

  beforeEach(() => {
    sutProvider = new SutProvider(ImportService);
  });

  describe("getImporterInstance", () => {
    describe("Get bitPasswordProtected importer", () => {
      let importer: Importer;
      const organizationId = Utils.newGuid();
      const password = Utils.newGuid();

      beforeEach(() => {
        importer = sutProvider.sut.getImporter(
          "bitwardenpasswordprotected",
          organizationId,
          password
        );
      });

      it("returns an instance of BitwardenPasswordProtectedImporter", () => {
        expect(importer).toBeInstanceOf(BitwardenPasswordProtectedImporter);
      });

      it("has the appropriate organization Id", () => {
        expect(importer.organizationId).toEqual(organizationId);
      });

      it("has the appropriate password", () => {
        expect(Object.entries(importer)).toEqual(jasmine.arrayContaining([["password", password]]));
      });
    });
  });
});
