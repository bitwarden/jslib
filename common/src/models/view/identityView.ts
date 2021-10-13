import { View } from './view';

import { Identity } from '../domain/identity';

import { linkable } from '../../misc/linkable.decorator';
import { Utils } from '../../misc/utils';

export class IdentityView implements View {
    @linkable(0)
    title: string = null;
    @linkable(1)
    middleName: string = null;
    @linkable(2)
    address1: string = null;
    @linkable(3)
    address2: string = null;
    @linkable(4)
    address3: string = null;
    @linkable(5, 'cityTown')
    city: string = null;
    @linkable(6, 'stateProvince')
    state: string = null;
    @linkable(7, 'zipPostalCode')
    postalCode: string = null;
    @linkable(8)
    country: string = null;
    @linkable(9)
    company: string = null;
    @linkable(10)
    email: string = null;
    @linkable(11)
    phone: string = null;
    @linkable(12)
    ssn: string = null;
    @linkable(13)
    username: string = null;
    @linkable(14)
    passportNumber: string = null;
    @linkable(15)
    licenseNumber: string = null;

    // tslint:disable
    private _firstName: string = null;
    private _lastName: string = null;
    private _subTitle: string = null;
    // tslint:enable

    constructor(i?: Identity) {
        // ctor
    }

    @linkable(16)
    get firstName(): string {
        return this._firstName;
    }
    set firstName(value: string) {
        this._firstName = value;
        this._subTitle = null;
    }

    @linkable(17)
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

    @linkable(18)
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
        const state = this.state;
        const postalCode = this.postalCode || '-';
        let addressPart2 = city;
        if (!Utils.isNullOrWhitespace(state)) {
            addressPart2 += ', ' + state;
        }
        addressPart2 += ', ' + postalCode;
        return addressPart2;
    }
}
