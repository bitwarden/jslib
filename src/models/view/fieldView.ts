import { FieldType } from '../../enums/fieldType';

import { View } from './view';

import { Field } from '../domain/field';

export class FieldView implements View {
    name: string = null;
    value: string = null;
    type: FieldType = null;
    newField: boolean = false; // Marks if the field is new and hasn't been saved
    showValue: boolean = false;

    constructor(f?: Field) {
        if (!f) {
            return;
        }

        this.type = f.type;
    }

    get maskedValue(): string {
        return this.value != null ? '••••••••' : null;
    }

    get arrayValue(): string[] {
        return this.value != null ?  Array.from(this.value) : [];
    }
}
