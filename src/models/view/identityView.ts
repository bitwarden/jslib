import { View } from './view';

import { Identity } from '../domain/identity';

export class IdentityView implements View {
    title: string;
    firstName: string;
    middleName: string;
    lastName: string;
    address1: string;
    address2: string;
    address3: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    company: string;
    email: string;
    phone: string;
    ssn: string;
    username: string;
    passportNumber: string;
    licenseNumber: string;

    constructor(i?: Identity) {
        // ctor
    }
}
