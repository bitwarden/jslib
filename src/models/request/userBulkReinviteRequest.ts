export class UserBulkReinviteRequest {
    ids: string[];

    constructor(ids: string[]) {
        this.ids = ids == null ? [] : ids;
    }
}
