import { FieldType } from '../../enums/fieldType';
import { LinkedIdType } from '../../enums/linkedIdType';

import { View } from './view';

import { Field } from '../domain/field';

export class FieldView implements View {
    name: string = null;
    value: string = null;
    type: FieldType = null;
    newField: boolean = false; // Marks if the field is new and hasn't been saved
    showValue: boolean = false;
    linkedId: LinkedIdType = null;

    constructor(f?: Field) {
        if (!f) {
            return;
        }

        this.type = f.type;
        this.linkedId = f.linkedId;
    }

    get maskedValue(): string {
        return this.value != null ? '••••••••' : null;
    }
}
