import { ItemView } from '../models/view/itemView';

import { LinkedId } from '../enums/linkedIdType';

export class LinkedMetadata {
    readonly propertyKey: string;
    private readonly _i18nKey: string;

    constructor(propertyKey: string, i18nKey?: string) {
        this.propertyKey = propertyKey;
        this._i18nKey = i18nKey;
    }

    get i18nKey() {
        return this._i18nKey ?? this.propertyKey;
    }
}

/**
 * A decorator used to set metadata used by Linked custom fields. Apply it to a class property or getter to make it 
 *    available as a Linked custom field option.
 * @param id - A unique value that is saved in the Field model. It is used to look up the decorated class property.
 * @param i18nKey - The i18n key used to describe the decorated class property in the UI. If it is null, then the name 
 *    of the class property will be used as the i18n key.
 */
export function setLinkedMetadata(id: LinkedId, i18nKey?: string) {
    return (prototype: ItemView, propertyKey: string) => {
        if (prototype.linkedMetadata == null) {
            prototype.linkedMetadata = new Map<number, LinkedMetadata>();
        }

        prototype.linkedMetadata.set(id, new LinkedMetadata(propertyKey, i18nKey));
    };
}
