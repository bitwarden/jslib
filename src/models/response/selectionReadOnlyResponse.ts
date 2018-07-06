export class SelectionReadOnlyResponse {
    id: string;
    readOnly: boolean;

    constructor(response: any) {
        this.id = response.Id;
        this.readOnly = response.ReadOnly;
    }
}
