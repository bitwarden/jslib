import { FieldType } from '../../enums/fieldType';

import { FieldView } from '../view/fieldView';

import { Field as FieldDomain } from '../domain/field';

export class Field {
    static template(): Field {
        const req = new Field();
        req.name = 'Field name';
        req.value = 'Some value';
        req.type = FieldType.Text;
        return req;
    }

    static toView(req: Field, view = new FieldView()) {
        view.type = req.type;
        view.value = req.value;
        view.name = req.name;
        return view;
    }

    name: string;
    value: string;
    type: FieldType;

    constructor(o?: FieldView | FieldDomain) {
        if (o == null) {
            return;
        }

        if (o instanceof FieldView) {
            this.name = o.name;
            this.value = o.value;
        } else {
            this.name = o.name?.encryptedString;
            this.value = o.value?.encryptedString;
        }
        this.type = o.type;
    }
}
