import { FolderData } from "jslib-common/models/data/folderData";

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
});
