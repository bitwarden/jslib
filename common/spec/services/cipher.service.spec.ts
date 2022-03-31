import { any, mock, MockProxy } from "jest-mock-extended";

import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { FileUploadService } from "jslib-common/abstractions/fileUpload.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { SearchService } from "jslib-common/abstractions/search.service";
import { SettingsService } from "jslib-common/abstractions/settings.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { Utils } from "jslib-common/misc/utils";
import { Cipher } from "jslib-common/models/domain/cipher";
import { EncArrayBuffer } from "jslib-common/models/domain/encArrayBuffer";
import { EncString } from "jslib-common/models/domain/encString";
import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";
import { ApiService } from "jslib-common/services/api.service";
import { CipherService } from "jslib-common/services/cipher.service";

const ENCRYPTED_TEXT = "This data has been encrypted";
const ENCRYPTED_BYTES = new EncArrayBuffer(Utils.fromUtf8ToArray(ENCRYPTED_TEXT).buffer);

describe("Cipher Service", () => {
  let cryptoService: MockProxy<CryptoService>;
  let stateService: MockProxy<StateService>;
  let settingsService: MockProxy<SettingsService>;
  let apiService: MockProxy<ApiService>;
  let fileUploadService: MockProxy<FileUploadService>;
  let i18nService: MockProxy<I18nService>;
  let searchService: MockProxy<SearchService>;
  let logService: MockProxy<LogService>;

  let cipherService: CipherService;

  beforeEach(() => {
    cryptoService = mock<CryptoService>();
    stateService = mock<StateService>();
    settingsService = mock<SettingsService>();
    apiService = mock<ApiService>();
    fileUploadService = mock<FileUploadService>();
    i18nService = mock<I18nService>();
    searchService = mock<SearchService>();
    logService = mock<LogService>();

    cryptoService.makeEncKey.mockResolvedValue([jest.fn(), jest.fn()] as any);
    cryptoService.encryptToBytes.mockResolvedValue(ENCRYPTED_BYTES);
    cryptoService.encrypt.mockResolvedValue(new EncString(ENCRYPTED_TEXT));

    cipherService = new CipherService(
      cryptoService,
      settingsService,
      apiService,
      fileUploadService,
      i18nService,
      () => searchService,
      logService,
      stateService
    );
  });

  it("attachments upload encrypted file contents", async () => {
    const fileName = "filename";
    const fileData = new Uint8Array(10).buffer;
    cryptoService.getOrgKey.mockResolvedValue(new SymmetricCryptoKey(new Uint8Array(32).buffer));
    apiService.postCipherAttachment.mockResolvedValue("123" as any);

    await cipherService.saveAttachmentRawWithServer(new Cipher(), fileName, fileData);

    expect(fileUploadService.uploadCipherAttachment).toHaveBeenCalledTimes(1);
    expect(fileUploadService.uploadCipherAttachment).toHaveBeenCalledWith(
      any(),
      any(),
      new EncString(ENCRYPTED_TEXT),
      ENCRYPTED_BYTES
    );
  });
});
