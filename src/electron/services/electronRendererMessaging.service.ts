import { ipcRenderer } from 'electron';

import { MessagingService } from '../../abstractions/messaging.service';

import { BroadcasterService } from '../../angular/services/broadcaster.service';

export class ElectronRendererMessagingService implements MessagingService {
    constructor(private broadcasterService: BroadcasterService) {
        ipcRenderer.on('messagingService', async (event: any, message: any) => {
            if (message.command) {
                this.send(message.command, message);
            }
        });
    }

    send(subscriber: string, arg: any = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        ipcRenderer.send('messagingService', message);
        this.broadcasterService.send(message);
    }
}
