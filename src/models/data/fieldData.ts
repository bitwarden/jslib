import { FieldType } from '../../enums/fieldType';

export class FieldData {
    type: FieldType;
    name: string;
    value: string;

    constructor(response: any) {
        this.type = response.Type;
        this.name = response.Name;
        this.value = response.Value;
    }
}
