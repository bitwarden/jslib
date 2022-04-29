import { EncryptionType } from "../../enums/encryptionType";

/**
 * Represents an Encrypted JSON string. Decrypts to an object of the specified type.
 */
export class EncObject<T> {
  /**
   *
   * @param encryptionType
   * @param data Encrypted json blob
   * @param iv
   * @param mac
   */
  constructor(
    private encryptionType: EncryptionType,
    private data: string,
    private iv: string,
    private mac: string
  ) {}
}
