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
 *  available as a Linked custom field option.
 * @param id - A unique value that is saved by the custom field. It is used to look up the related class property.
 * @param i18nKey - The i18n key used to describe the class property in the UI. Optional. If it is null, then the
 *  name of the class property will be used as the i18n key.
 */
export function setLinkedMetadata(id: LinkedId, i18nKey?: string) {
    return (prototype: ItemView, propertyKey: string) => {
        if (prototype.linkedMetadata == null) {
            prototype.linkedMetadata = new Map<number, LinkedMetadata>();
        } else if (prototype.linkedMetadata.has(id)) {
            throw new Error('Linked metadata must use unique ids. Id ' + id + ' has been used more than once.');
        }

        prototype.linkedMetadata.set(id, new LinkedMetadata(propertyKey, i18nKey));
    };
}
