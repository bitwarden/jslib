export class UserBulkDeleteRequest {
    ids: string[];

    constructor(ids: string[]) {
        this.ids = ids == null ? [] : ids;
    }
}
