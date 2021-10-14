// A decorator used to configure "linkable" properties on cipher types.
// A "linkable" property is made available as an option when configuring a Linked Custom Field.
// The id must be unique and must not be changed.

export const metadataKey = 'linkedFieldOptions';

export class LinkableMetadata {
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

export function linkable(id: number, i18nKey?: string) {
    return (prototype: any, propertyKey: string) => {
        if (!prototype.hasOwnProperty(metadataKey)) {
            Object.defineProperty(prototype, metadataKey, {
                value: new Map<number, LinkableMetadata>(),
            });
        } else if (prototype[metadataKey].has(id)) {
            throw new Error('Linkable metadata must use unique ids. Id ' + id + ' has been used more than once.');
        }

        prototype[metadataKey].set(id, new LinkableMetadata(propertyKey, i18nKey));
    };
}
