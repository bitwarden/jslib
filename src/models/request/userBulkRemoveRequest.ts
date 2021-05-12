export class UserBulkRemoveRequest {
    ids: string[];

    constructor(ids: string[]) {
        this.ids = ids == null ? [] : ids;
    }
}
