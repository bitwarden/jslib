import { MessagingService } from '../../abstractions/messaging.service';

import { WindowMain } from '../window.main';

export class ElectronMainMessagingService implements MessagingService {
    constructor(private windowMain: WindowMain, private onMessage: (message: any) => void) { }

    send(subscriber: string, arg: any = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        this.onMessage(message);
        if (this.windowMain.win != null) {
            this.windowMain.win.webContents.send('messagingService', message);
        }
    }
}
