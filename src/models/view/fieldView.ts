import { FieldType } from '../../enums/fieldType';

import { View } from './view';

import { Field } from '../domain/field';

export class FieldView implements View {
    name: string;
    type: FieldType;

    // tslint:disable
    private _value: string;
    private _maskedValue: string;
    // tslint:enable

    constructor(f?: Field) {
        if (!f) {
            return;
        }

        this.type = f.type;
    }

    get value(): string {
        return this._value;
    }
    set value(value: string) {
        this._value = value;
        this._maskedValue = null;
    }

    get maskedValue(): string {
        if (this._maskedValue == null && this.value != null) {
            this._maskedValue = '';
            for (let i = 0; i < this.value.length; i++) {
                this._maskedValue += '•';
            }
        }

        return this._maskedValue;
    }
}
