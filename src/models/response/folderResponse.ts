export class FolderResponse {
    id: string;
    name: string;
    revisionDate: string;

    constructor(response: any) {
        this.id = response.Id;
        this.name = response.Name;
        this.revisionDate = response.RevisionDate;
    }
}
