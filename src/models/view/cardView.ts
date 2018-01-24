import { View } from './view';

import { Card } from '../domain/card';

export class CardView implements View {
    cardholderName: string;
    expMonth: string;
    expYear: string;
    code: string;

    // tslint:disable
    private _brand: string;
    private _number: string;
    private _subTitle: string;
    // tslint:enable

    constructor(c?: Card) {
        // ctor
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
}
