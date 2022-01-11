import { KdfType } from "../enums/kdfType";
import { Organization } from "../models/domain/organization";

export abstract class KeyConnectorService {
  getAndSetKey: (url?: string) => Promise<void>;
  postAndSetKey: (url: string, kdf: KdfType, kdfIterations: number, orgId: string) => Promise<void>;
  getManagingOrganization: () => Promise<Organization>;
  getUsesKeyConnector: () => Promise<boolean>;
  migrateUser: () => Promise<void>;
  userNeedsMigration: () => Promise<boolean>;
  setUsesKeyConnector: (enabled: boolean) => Promise<void>;
  setConvertAccountRequired: (status: boolean) => Promise<void>;
  getConvertAccountRequired: () => Promise<boolean>;
  removeConvertAccountRequired: () => Promise<void>;
  clear: () => Promise<void>;
}
