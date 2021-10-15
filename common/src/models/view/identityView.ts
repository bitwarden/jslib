import { ItemView } from './itemView';

import { Identity } from '../domain/identity';

import { setLinkedMetadata } from '../../misc/setLinkedMetadata';
import { Utils } from '../../misc/utils';

export class IdentityView extends ItemView {
    @setLinkedMetadata(0)
    title: string = null;
    @setLinkedMetadata(1)
    middleName: string = null;
    @setLinkedMetadata(2)
    address1: string = null;
    @setLinkedMetadata(3)
    address2: string = null;
    @setLinkedMetadata(4)
    address3: string = null;
    @setLinkedMetadata(5, 'cityTown')
    city: string = null;
    @setLinkedMetadata(6, 'stateProvince')
    state: string = null;
    @setLinkedMetadata(7, 'zipPostalCode')
    postalCode: string = null;
    @setLinkedMetadata(8)
    country: string = null;
    @setLinkedMetadata(9)
    company: string = null;
    @setLinkedMetadata(10)
    email: string = null;
    @setLinkedMetadata(11)
    phone: string = null;
    @setLinkedMetadata(12)
    ssn: string = null;
    @setLinkedMetadata(13)
    username: string = null;
    @setLinkedMetadata(14)
    passportNumber: string = null;
    @setLinkedMetadata(15)
    licenseNumber: string = null;

    // tslint:disable
    private _firstName: string = null;
    private _lastName: string = null;
    private _subTitle: string = null;
    // tslint:enable

    constructor(i?: Identity) {
        super();
    }

    @setLinkedMetadata(16)
    get firstName(): string {
        return this._firstName;
    }
    set firstName(value: string) {
        this._firstName = value;
        this._subTitle = null;
    }

    @setLinkedMetadata(17)
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

    @setLinkedMetadata(18)
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
