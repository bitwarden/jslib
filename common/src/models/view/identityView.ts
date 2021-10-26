import { ItemView } from './itemView';

import { Identity } from '../domain/identity';

import { setLinkedMetadata } from '../../misc/setLinkedMetadata.decorator';
import { Utils } from '../../misc/utils';

import { IdentityLinkedIds as LinkedId } from '../../enums/linkedIdType';

export class IdentityView extends ItemView {
    @setLinkedMetadata(LinkedId.Title)
    title: string = null;
    @setLinkedMetadata(LinkedId.MiddleName)
    middleName: string = null;
    @setLinkedMetadata(LinkedId.Address1)
    address1: string = null;
    @setLinkedMetadata(LinkedId.Address2)
    address2: string = null;
    @setLinkedMetadata(LinkedId.Address3)
    address3: string = null;
    @setLinkedMetadata(LinkedId.City, 'cityTown')
    city: string = null;
    @setLinkedMetadata(LinkedId.State, 'stateProvince')
    state: string = null;
    @setLinkedMetadata(LinkedId.PostalCode, 'zipPostalCode')
    postalCode: string = null;
    @setLinkedMetadata(LinkedId.Country)
    country: string = null;
    @setLinkedMetadata(LinkedId.Company)
    company: string = null;
    @setLinkedMetadata(LinkedId.Email)
    email: string = null;
    @setLinkedMetadata(LinkedId.Phone)
    phone: string = null;
    @setLinkedMetadata(LinkedId.Ssn)
    ssn: string = null;
    @setLinkedMetadata(LinkedId.Username)
    username: string = null;
    @setLinkedMetadata(LinkedId.PassportNumber)
    passportNumber: string = null;
    @setLinkedMetadata(LinkedId.LicenseNumber)
    licenseNumber: string = null;

    // tslint:disable
    private _firstName: string = null;
    private _lastName: string = null;
    private _subTitle: string = null;
    // tslint:enable

    constructor(i?: Identity) {
        super();
    }

    @setLinkedMetadata(LinkedId.FirstName)
    get firstName(): string {
        return this._firstName;
    }
    set firstName(value: string) {
        this._firstName = value;
        this._subTitle = null;
    }

    @setLinkedMetadata(LinkedId.LastName)
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

    @setLinkedMetadata(LinkedId.FullName)
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
