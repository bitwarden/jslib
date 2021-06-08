import { IdentityData } from '../data/identityData';

import Domain from './domainBase';
import { EncString } from './encString';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

import { IdentityView } from '../view/identityView';

export class Identity extends Domain {
    title: EncString;
    firstName: EncString;
    middleName: EncString;
    lastName: EncString;
    address1: EncString;
    address2: EncString;
    address3: EncString;
    city: EncString;
    state: EncString;
    postalCode: EncString;
    country: EncString;
    company: EncString;
    email: EncString;
    phone: EncString;
    ssn: EncString;
    username: EncString;
    passportNumber: EncString;
    licenseNumber: EncString;

    constructor(obj?: IdentityData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            title: null,
            firstName: null,
            middleName: null,
            lastName: null,
            address1: null,
            address2: null,
            address3: null,
            city: null,
            state: null,
            postalCode: null,
            country: null,
            company: null,
            email: null,
            phone: null,
            ssn: null,
            username: null,
            passportNumber: null,
            licenseNumber: null,
        }, alreadyEncrypted, []);
    }

    decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<IdentityView> {
        return this.decryptObj(new IdentityView(this), {
            title: null,
            firstName: null,
            middleName: null,
            lastName: null,
            address1: null,
            address2: null,
            address3: null,
            city: null,
            state: null,
            postalCode: null,
            country: null,
            company: null,
            email: null,
            phone: null,
            ssn: null,
            username: null,
            passportNumber: null,
            licenseNumber: null,
        }, orgId, encKey);
    }

    toIdentityData(): IdentityData {
        const i = new IdentityData();
        this.buildDataModel(this, i, {
            title: null,
            firstName: null,
            middleName: null,
            lastName: null,
            address1: null,
            address2: null,
            address3: null,
            city: null,
            state: null,
            postalCode: null,
            country: null,
            company: null,
            email: null,
            phone: null,
            ssn: null,
            username: null,
            passportNumber: null,
            licenseNumber: null,
        });
        return i;
    }
}
