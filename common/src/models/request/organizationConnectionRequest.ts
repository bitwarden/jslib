import { OrganizationConnectionType } from "jslib-common/enums/organizationConnectionType";

import { BillingSyncConfigRequest } from "./billingSyncConfigRequest";

/**API request config types for OrganizationConnectionRequest */
export type OrganizationConnectionRequestConfigs = BillingSyncConfigRequest;

export class OrganizationConnectionRequest {
  config: string;

  constructor(
    public organizationId: string,
    public type: OrganizationConnectionType,
    public enabled: boolean,
    config: OrganizationConnectionRequestConfigs
  ) {
    this.config = JSON.stringify(config);
  }
}
