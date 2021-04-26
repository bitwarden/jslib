export class CustomCharacterData {
    private _characters: string[];

    constructor(characters: string[]) {
        console.assert(characters instanceof Array);
        this._characters = characters;
    }
    get characters() { return this._characters; }

    toString() {
        return `[${this._characters.join("")}]`;
    }

    toHTMLString() {
        return `[${this._characters.join("").replace('"', "&quot;")}]`;
    }
};