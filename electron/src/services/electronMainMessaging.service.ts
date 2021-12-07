import { app, dialog, ipcMain, Menu, MenuItem, nativeTheme } from 'electron';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { ThemeType } from 'jslib-common/enums/themeType';
import * as path from 'path';
import { RendererMenuItem } from '../utils';
import { WindowMain } from '../window.main';



export class ElectronMainMessagingService implements MessagingService {
    private autoTypeLib: any;

    constructor(private windowMain: WindowMain, private onMessage: (message: any) => void) {
        ipcMain.handle('appVersion', () => {
            return app.getVersion();
        });

        ipcMain.handle('systemTheme', () => {
            return nativeTheme.shouldUseDarkColors ? ThemeType.Dark : ThemeType.Light;
        });

        ipcMain.handle('showMessageBox', (event, options) => {
            return dialog.showMessageBox(options);
        });

        ipcMain.handle('openContextMenu', (event, options: { menu: RendererMenuItem[] }) => {
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
                menu.popup({
                    window: windowMain.win, callback: () => {
                        resolve(-1);
                    }
                });
            });
        });

        ipcMain.handle('autoType', (event, username, password) => {
            return new Promise(async (resolve, reject) => {

                const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

                //just so that webpack doesn't mess this import
                const req = eval("require");

                if (process.platform === 'darwin')
                    this.autoTypeLib = req(path.join(__dirname, 'Release', 'autotype'));
                else return Promise.resolve(false); //until implemented

                this.autoTypeLib.SwitchWindow();
                await sleep(100);
                this.autoTypeLib.TypeString(username);
                await sleep(50);
                this.autoTypeLib.Tab();
                await sleep(50);
                this.autoTypeLib.TypeString(password);
                await sleep(50);
                this.autoTypeLib.Enter();

                Promise.resolve(true);
            });
        });

        ipcMain.handle('windowVisible', () => {
            return windowMain.win?.isVisible();
        });

        nativeTheme.on('updated', () => {
            windowMain.win?.webContents.send('systemThemeUpdated', nativeTheme.shouldUseDarkColors ? ThemeType.Dark : ThemeType.Light);
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
