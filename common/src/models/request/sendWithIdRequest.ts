import { SendRequest } from './sendRequest';

import { Send } from '../domain/send';

export class SendWithIdRequest extends SendRequest {
    id: string;

    constructor(send: Send) {
        super(send);
        this.id = send.id;
    }
}
