import { FieldType } from '../../enums/fieldType';

import { FieldApi } from '../api/fieldApi';

export class FieldData {
    type: FieldType;
    name: string;
    value: string;

    constructor(response: FieldApi) {
        this.type = response.type;
        this.name = response.name;
        this.value = response.value;
    }
}
