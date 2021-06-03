import { ipcMain } from 'electron';

import {
    deletePassword,
    getPassword,
    setPassword,
} from 'keytar';

export class KeytarStorageListener {
    constructor(private serviceName: string) { }

    init() {
        ipcMain.on('keytar', async (event: any, message: any) => {
            try {
                let val: string = null;
                if (message.action && message.key) {
                    if (message.action === 'getPassword') {
                        val = await getPassword(this.serviceName, message.key);
                    } else if (message.action === 'setPassword' && message.value) {
                        await setPassword(this.serviceName, message.key, message.value);
                    } else if (message.action === 'deletePassword') {
                        await deletePassword(this.serviceName, message.key);
                    }
                }

                event.returnValue = val;
            } catch {
                event.returnValue = null;
            }
        });
    }
}
