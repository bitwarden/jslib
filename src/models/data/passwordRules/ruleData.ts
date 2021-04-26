export class RuleData {
    private _name: string;
    value: any;

    constructor(name: string, value: any) {
        this._name = name;
        this.value = value;
    }

    public get name(): string {
        return this._name;
    }

    toString() {
        return JSON.stringify(this);
    }
};