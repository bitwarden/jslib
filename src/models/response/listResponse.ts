export class ListResponse<T> {
    data: T[];
    continuationToken: string;

    constructor(response: any, t: new (dataResponse: any) => T) {
        this.data = response.Data.map((dr: any) => new t(dr));
        this.continuationToken = response.ContinuationToken;
    }
}
