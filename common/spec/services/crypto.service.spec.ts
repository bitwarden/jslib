import { Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { Utils } from "jslib-common/misc/utils";
import { EncArrayBuffer } from "jslib-common/models/domain/encArrayBuffer";
import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";
import { CryptoService } from "jslib-common/services/crypto.service";
import { WebCryptoFunctionService } from "jslib-common/services/webCryptoFunction.service";

import { makeStaticByteArray } from "../utils";

describe("Crypto Service", () => {
  let cryptoFunctionService: CryptoFunctionService;
  let platformUtilsService: SubstituteOf<PlatformUtilsService>;
  let logService: SubstituteOf<LogService>;
  let stateService: SubstituteOf<StateService>;

  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoFunctionService = new WebCryptoFunctionService(window);
    platformUtilsService = Substitute.for<PlatformUtilsService>();
    logService = Substitute.for<LogService>();
    stateService = Substitute.for<StateService>();

    cryptoService = new CryptoService(
      cryptoFunctionService,
      platformUtilsService,
      logService,
      stateService
    );
  });

  it("encrypt EncObject", async () => {
    const data = {
      name: "Random",
    };

    const spy = jest
      .spyOn(cryptoFunctionService, "randomBytes")
      .mockImplementation(() => Promise.resolve(makeStaticByteArray(16)));

    const key = makeStaticByteArray(32);
    const symKey = new SymmetricCryptoKey(key.buffer);

    const encrypted = await cryptoService.encryptObject(data, symKey);

    expect(encrypted).toEqual({
      encryptionType: 0,
      data: "HQjAyiEJss8N3xwNqJen8R4aE/XToFeV7LIBI7SYkTc=",
      iv: "AAECAwQFBgcICQoLDA0ODw==",
      mac: null,
    });

    spy.mockRestore();
  });

  it("decrypt EncObject", async () => {
    const key = makeStaticByteArray(32);
    const symKey = new SymmetricCryptoKey(key.buffer);

    const decrypted = await cryptoService.decryptObject(
      {
        encryptionType: 0,
        data: "HQjAyiEJss8N3xwNqJen8R4aE/XToFeV7LIBI7SYkTc=",
        iv: "AAECAwQFBgcICQoLDA0ODw==",
        mac: null,
      },
      symKey
    );

    expect(decrypted).toEqual({
      name: "Random",
    });
  });
});
