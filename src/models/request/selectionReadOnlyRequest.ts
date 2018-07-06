export class SelectionReadOnlyRequest {
    id: string;
    readOnly: boolean;

    constructor(id: string, readOnly: boolean) {
        this.id = id;
        this.readOnly = readOnly;
    }
}
