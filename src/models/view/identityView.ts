import { View } from './view';

import { Identity } from '../domain/identity';

import { Utils } from '../../misc/utils';

export class IdentityView implements View {
    title: string = null;
    middleName: string;
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

    // tslint:disable
    private _firstName: string;
    private _lastName: string;
    private _subTitle: string;
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
        if (Utils.isNullOrWhitespace(this.address2)) {
            if (Utils.isNullOrWhitespace(address)) {
                address += ', ';
            }
            address += this.address2;
        }
        if (Utils.isNullOrWhitespace(this.address3)) {
            if (Utils.isNullOrWhitespace(address)) {
                address += ', ';
            }
            address += this.address3;
        }
        return address;
    }
}
