import { UriMatchType } from '../../enums/uriMatchType';

export class LoginUriApi {
    uri: string;
    match: UriMatchType = null;

    constructor(data: any) {
        this.uri = data.Uri;
        this.match = data.Match != null ? data.Match : null;
    }
}
