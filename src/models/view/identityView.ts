import { View } from './view';

import { Identity } from '../domain/identity';

import { Utils } from '../../misc/utils';

export class IdentityView implements View {
    title: string = null;
    middleName: string = null;
    address1: string = null;
    address2: string = null;
    address3: string = null;
    city: string = null;
    state: string = null;
    postalCode: string = null;
    country: string = null;
    company: string = null;
    email: string = null;
    phone: string = null;
    ssn: string = null;
    username: string = null;
    passportNumber: string = null;
    licenseNumber: string = null;

    // tslint:disable
    private _firstName: string = null;
    private _lastName: string = null;
    private _subTitle: string = null;
    // tslint:enable

    constructor(i?: Identity) {
        // ctor
    }

    get firstName(): string {
        return this._firstName;
    }
    set firstName(value: string) {
        this._firstName = value;
        this._subTitle = null;
    }

    get lastName(): string {
        return this._lastName;
    }
    set lastName(value: string) {
        this._lastName = value;
        this._subTitle = null;
    }

    get subTitle(): string {
        if (this._subTitle == null && (this.firstName != null || this.lastName != null)) {
            this._subTitle = '';
            if (this.firstName != null) {
                this._subTitle = this.firstName;
            }
            if (this.lastName != null) {
                if (this._subTitle !== '') {
                    this._subTitle += ' ';
                }
                this._subTitle += this.lastName;
            }
        }

        return this._subTitle;
    }

    get fullName(): string {
        if (this.title != null || this.firstName != null || this.middleName != null || this.lastName != null) {
            let name = '';
            if (this.title != null) {
                name += (this.title + ' ');
            }
            if (this.firstName != null) {
                name += (this.firstName + ' ');
            }
            if (this.middleName != null) {
                name += (this.middleName + ' ');
            }
            if (this.lastName != null) {
                name += this.lastName;
            }
            return name.trim();
        }

        return null;
    }

    get fullAddress(): string {
        let address = this.address1;
        if (!Utils.isNullOrWhitespace(this.address2)) {
            if (!Utils.isNullOrWhitespace(address)) {
                address += ', ';
            }
            address += this.address2;
        }
        if (!Utils.isNullOrWhitespace(this.address3)) {
            if (!Utils.isNullOrWhitespace(address)) {
                address += ', ';
            }
            address += this.address3;
        }
        return address;
    }

    get fullAddressPart2(): string {
        if (this.city == null && this.state == null && this.postalCode == null) {
            return null;
        }
        const city = this.city || '-';
        const state = this.state || '-';
        const postalCode = this.postalCode || '-';
        return city + ', ' + state + ', ' + postalCode;
    }
}
