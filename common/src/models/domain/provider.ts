import { ProviderUserStatusType } from '../../enums/providerUserStatusType';
import { ProviderUserType } from '../../enums/providerUserType';
import { ProviderData } from '../data/providerData';


export class Provider {
    id: string;
    name: string;
    status: ProviderUserStatusType;
    type: ProviderUserType;
    enabled: boolean;
    userId: string;

    constructor(obj?: ProviderData) {
        if (obj == null) {
            return;
        }

        this.id = obj.id;
        this.name = obj.name;
        this.status = obj.status;
        this.type = obj.type;
        this.enabled = obj.enabled;
        this.userId = obj.userId;
    }

    get canAccess() {
        if (this.type === ProviderUserType.ProviderAdmin) {
            return true;
        }
        return this.enabled && this.status === ProviderUserStatusType.Confirmed;
    }
}
