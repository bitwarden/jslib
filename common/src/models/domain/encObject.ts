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
    public encryptionType: EncryptionType,
    public data: string,
    public iv: string,
    public mac: string
  ) {}
}
