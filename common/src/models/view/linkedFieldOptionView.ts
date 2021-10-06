export class LinkedFieldOptionView {
    readonly propertyName: string;
    private readonly _i18nKey: string;

    constructor(propertyName: string, i18nKey: string = null) {
        this.propertyName = propertyName;
        this._i18nKey = i18nKey;
    }

    get i18nKey() {
        return this._i18nKey ?? this.propertyName;
    }
}
