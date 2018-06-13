import { View } from './view';

import { Card } from '../domain/card';

export class CardView implements View {
    cardholderName: string;
    expMonth: string = null;
    expYear: string;
    code: string;

    // tslint:disable
    private _brand: string = null;
    private _number: string;
    private _subTitle: string;
    // tslint:enable

    constructor(c?: Card) {
        // ctor
    }

    get maskedCode(): string {
        return this.code != null ? '••••' : null;
    }

    get brand(): string {
        return this._brand;
    }
    set brand(value: string) {
        this._brand = value;
        this._subTitle = null;
    }

    get number(): string {
        return this._number;
    }
    set number(value: string) {
        this._number = value;
        this._subTitle = null;
    }

    get subTitle(): string {
        if (this._subTitle == null) {
            this._subTitle = this.brand;
            if (this.number != null && this.number.length >= 4) {
                if (this._subTitle != null && this._subTitle !== '') {
                    this._subTitle += ', ';
                } else {
                    this._subTitle = '';
                }
                this._subTitle += ('*' + this.number.substr(this.number.length - 4));
            }
        }
        return this._subTitle;
    }

    get expiration(): string {
        if (!this.expMonth && !this.expYear) {
            return null;
        }

        let exp = this.expMonth != null ? ('0' + this.expMonth).slice(-2) : '__';
        exp += (' / ' + (this.expYear != null ? this.formatYear(this.expYear) : '____'));
        return exp;
    }

    private formatYear(year: string): string {
        return year.length === 2 ? '20' + year : year;
    }
}
