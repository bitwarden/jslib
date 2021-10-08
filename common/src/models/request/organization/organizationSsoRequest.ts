import { SsoConfigApi } from '../../api/ssoConfigApi';

export class OrganizationSsoRequest {
    enabled: boolean = false;
    data: SsoConfigApi;
}
