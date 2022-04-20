import Substitute from "@fluffy-spoon/substitute";

import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { FolderData } from "jslib-common/models/data/folderData";
import { Folder } from "jslib-common/models/domain/folder";
import { FolderView } from "jslib-common/models/view/folderView";

import { mockEnc } from "../utils";

describe("Folder", () => {
  it("Convert", () => {
    const data = new FolderData();
    data.id = "id";
    data.name = "encName";
    data.revisionDate = "2022-01-31T12:00:00.000Z";

    const field = data.toFolder();

    expect(field).toEqual({
      id: "id",
      name: { encryptedString: "encName", encryptionType: 0 },
      revisionDate: new Date("2022-01-31T12:00:00.000Z"),
    });
  });

  it("Decrypt", async () => {
    const folder: Folder = {
      id: "id",
      name: mockEnc("encName"),
      revisionDate: new Date("2022-01-31T12:00:00.000Z"),
    };

    const cryptoService = Substitute.for<CryptoService>();
    const view = await FolderView.fromFolder(cryptoService, folder);

    expect(view).toEqual({
      id: "id",
      name: "encName",
      revisionDate: new Date("2022-01-31T12:00:00.000Z"),
    });
  });
});
