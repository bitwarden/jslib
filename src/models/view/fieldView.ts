import { FieldType } from '../../enums/fieldType';

import { View } from './view';

import { Field } from '../domain/field';

export class FieldView implements View {
    name: string;
    vault: string;
    type: FieldType;

    constructor(f: Field) {
        this.type = f.type;
    }
}
