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
    return (target: object, propertyKey: string) => {
        if (!target.hasOwnProperty(metadataKey)) {
            Object.defineProperty(target, metadataKey, {
                value: new Map<number, LinkableMetadata>(),
            });
        }

        (target as any)[metadataKey].set(id, new LinkableMetadata(propertyKey, i18nKey));
    };
}
