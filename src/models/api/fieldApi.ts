import { FieldType } from '../../enums/fieldType';

export class FieldApi {
    name: string;
    value: string;
    type: FieldType;

    constructor(response: any) {
        this.type = response.Type;
        this.name = response.Name;
        this.value = response.Value;
    }
}
