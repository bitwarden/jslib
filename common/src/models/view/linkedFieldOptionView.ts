export class LinkedFieldOption {
    readonly id: number;
    propertyName: string;
    private _i18nKey: string;

    constructor(id: number, propertyName: string, i18nKey: string = null) {
        this.id = id;
        this.propertyName = propertyName;
        this._i18nKey = i18nKey;
    }

    get i18nKey() {
        return this._i18nKey ?? this.propertyName;
    }
}
