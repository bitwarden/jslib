// A decorator used to configure property metadata used by Linked custom fields.
// Apply it to a class property or getter to make it available as a Linked field option.
// The id must be unique and must not be changed.

import { ItemView } from '../models/view/itemView';

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

export function setLinkedMetadata(id: number, i18nKey?: string) {
    return (prototype: ItemView, propertyKey: string) => {
        if (prototype.linkedMetadata == null) {
            prototype.linkedMetadata = new Map<number, LinkedMetadata>();
        } else if (prototype.linkedMetadata.has(id)) {
            throw new Error('Linkable metadata must use unique ids. Id ' + id + ' has been used more than once.');
        }

        prototype.linkedMetadata.set(id, new LinkedMetadata(propertyKey, i18nKey));
    };
}
