import { OrganizationConnectionType } from "jslib-common/enums/organizationConnectionType";

import { BillingSyncConfigRequest } from "./billingSyncConfigRequest";

/**API request config types for OrganizationConnectionRequest */
export type OrganizationConnectionRequestConfigs = BillingSyncConfigRequest;

export class OrganizationConnectionRequest {
  constructor(
    public organizationId: string,
    public type: OrganizationConnectionType,
    public enabled: boolean,
    public config: OrganizationConnectionRequestConfigs
  ) {}
}
