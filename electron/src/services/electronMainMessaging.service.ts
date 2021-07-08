import { app, dialog, ipcMain, Menu, MenuItem, nativeTheme } from 'electron';
import { promises as fs } from 'fs';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { RendererMenuItem } from '../utils';

import { WindowMain } from '../window.main';

export class ElectronMainMessagingService implements MessagingService {
    constructor(private windowMain: WindowMain, private onMessage: (message: any) => void) {
        ipcMain.handle('appVersion', () => {
            return app.getVersion();
        });

        ipcMain.handle('systemTheme', () => {
            return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        });

        ipcMain.handle('showMessageBox', (event, options) => {
            return dialog.showMessageBox(options);
        });

        ipcMain.handle('openContextMenu', (event, options: {menu: RendererMenuItem[]}) => {
            return new Promise(resolve => {
                const menu = new Menu();
                options.menu.forEach((m, index) => {
                    menu.append(new MenuItem({
                        label: m.label,
                        type: m.type,
                        click: () => {
                            resolve(index);
                        },
                    }));
                });
                menu.popup({ window: windowMain.win, callback: () => {
                    resolve(-1);
                }});
            });
        });

        ipcMain.handle('windowVisible', () => {
            return windowMain.win?.isVisible();
        });

        nativeTheme.on('updated', () => {
            windowMain.win?.webContents.send('systemThemeUpdated', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
        });
    }

    send(subscriber: string, arg: any = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        this.onMessage(message);
        if (this.windowMain.win != null) {
            this.windowMain.win.webContents.send('messagingService', message);
        }
    }
}
