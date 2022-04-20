import Substitute, { SubstituteOf } from "@fluffy-spoon/substitute";

import { ApiService } from "jslib-common/abstractions/api.service";
import { CipherService } from "jslib-common/abstractions/cipher.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { FolderData } from "jslib-common/models/data/folderData";
import { FolderService } from "jslib-common/services/folder.service";

describe("FolderService", () => {
  let stateService: SubstituteOf<StateService>;

  let folderService: FolderService;

  beforeEach(() => {
    const cryptoService = Substitute.for<CryptoService>();
    const apiService = Substitute.for<ApiService>();
    const i18nService = Substitute.for<I18nService>();
    const cipherService = Substitute.for<CipherService>();
    stateService = Substitute.for<StateService>();

    folderService = new FolderService(
      cryptoService,
      apiService,
      i18nService,
      cipherService,
      stateService
    );
  });

  describe("clearCache", () => {
    it("without userId", async () => {
      await folderService.clearCache(null);

      stateService.received(1).setDecryptedFolders(null, { userId: null });
    });

    it("with userId", async () => {
      await folderService.clearCache("userId");

      stateService.received(1).setDecryptedFolders(null, { userId: "userId" });
    });
  });

  describe("get", () => {
    it("retrieves folder", async () => {
      const f = new FolderData();
      f.id = "id";
      f.name = "encName";
      f.revisionDate = "2022-01-31T12:00:00.000Z";

      stateService.getEncryptedFolders().resolves({ id: f });
      const folder = await folderService.get("id");

      expect(folder).toEqual({
        id: "id",
        name: { encryptedString: "encName", encryptionType: 0 },
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
      });
    });

    describe("not exist", () => {
      it("folders are null", async () => {
        stateService.getEncryptedFolders().resolves(null);
        const folder = await folderService.get("id");

        expect(folder).toBeNull();
      });

      it("folder does not exist", async () => {
        const f = new FolderData();
        f.id = "id";
        f.name = "encName";
        f.revisionDate = "2022-01-31T12:00:00.000Z";

        stateService.getEncryptedFolders().resolves({ id: f });
        const folder = await folderService.get("id2");

        expect(folder).toBeNull();
      });
    });
  });

  describe("getAll", () => {
    it("retrieves folder", async () => {
      const f = new FolderData();
      f.id = "id";
      f.name = "encName";
      f.revisionDate = "2022-01-31T12:00:00.000Z";

      stateService.getEncryptedFolders().resolves({ id: f });
      const folder = await folderService.getAll();

      expect(folder).toEqual([
        {
          id: "id",
          name: { encryptedString: "encName", encryptionType: 0 },
          revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        },
      ]);
    });

    it("null", async () => {
      stateService.getEncryptedFolders().resolves(null);
      const folders = await folderService.getAll();

      expect(folders).toHaveLength(0);
    });
  });
});
