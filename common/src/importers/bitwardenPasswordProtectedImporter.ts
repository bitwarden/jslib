import { BaseImporter } from "./baseImporter";
import { Importer } from "./importer";

import { EncString } from "../models/domain/encString";
import { ImportResult } from "../models/domain/importResult";

import { CryptoService } from "../abstractions/crypto.service";
import { I18nService } from "../abstractions/i18n.service";
import { KdfType } from "../enums/kdfType";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { ImportService } from "../abstractions/import.service";

class BitwardenPasswordProtectedFileFormat {
  encrypted: boolean;
  passwordProtected: boolean;
  format: "json" | "csv" | "encrypted_json";
  salt: string;
  kdfIterations: number;
  encKeyValidation_DO_NOT_EDIT: string;
  data: string;
}

export class BitwardenPasswordProtectedImporter extends BaseImporter implements Importer {
  private results: BitwardenPasswordProtectedFileFormat;
  private result: ImportResult;
  private innerImporter: Importer;
  private key: SymmetricCryptoKey;

  constructor(
    private importService: ImportService,
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private password: string
  ) {
    super();
  }

  async parse(data: string): Promise<ImportResult> {
    this.result = new ImportResult();
    this.results = JSON.parse(data);
    if (!this.canParseFile(this.results)) {
      this.result.success = false;
      return this.result;
    }

    this.setInnerImporter(this.results.format);

    if (!(await this.checkPassword(this.results))) {
      this.result.success = false;
      this.result.errorMessage = this.i18nService.t("importEncKeyError");
      return this.result;
    }

    const encData = new EncString(this.results.data);
    const clearTextData = await this.cryptoService.decryptToUtf8(encData, this.key);
    return this.innerImporter.parse(clearTextData);
  }

  private async checkPassword(jdoc: BitwardenPasswordProtectedFileFormat): Promise<boolean> {
    this.key = await this.cryptoService.makePinKey(
      this.password,
      jdoc.salt,
      KdfType.PBKDF2_SHA256,
      jdoc.kdfIterations
    );

    const encKeyValidation = new EncString(this.results.encKeyValidation_DO_NOT_EDIT);

    const encKeyValidationDecrypt = await this.cryptoService.decryptToUtf8(
      encKeyValidation,
      this.key
    );
    if (encKeyValidationDecrypt === null) {
      return false;
    }
    return true;
  }

  private canParseFile(jdoc: BitwardenPasswordProtectedFileFormat): boolean {
    if (
      !jdoc ||
      !jdoc.encrypted ||
      !jdoc.passwordProtected ||
      !(jdoc.format === "csv" || jdoc.format === "json" || jdoc.format == "encrypted_json") ||
      !jdoc.salt ||
      !jdoc.kdfIterations ||
      typeof jdoc.kdfIterations !== "number" ||
      !jdoc.encKeyValidation_DO_NOT_EDIT ||
      !jdoc.data
    ) {
      return false;
    }
    return true;
  }

  private setInnerImporter(format: "csv" | "json" | "encrypted_json") {
    this.innerImporter =
      format === "csv"
        ? this.importService.getImporter("bitwardencsv", this.organizationId)
        : this.importService.getImporter("bitwardenjson", this.organizationId);
  }
}
