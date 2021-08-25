import { app, BrowserWindow, screen } from 'electron';

import * as path from 'path';
import * as url from 'url';

import { isDev, isMacAppStore, isSnapStore } from './utils';

import { AccountService } from 'jslib-common/abstractions/account.service';
import { StorageKey } from 'jslib-common/enums/storageKey';

const WindowEventHandlingDelay = 100;
export class WindowMain {
    win: BrowserWindow;
    isQuitting: boolean = false;

    private windowStateChangeTimer: NodeJS.Timer;
    private windowStates: { [key: string]: any; } = {};
    private enableAlwaysOnTop: boolean = false;

    constructor(private hideTitleBar = false, private defaultWidth = 950,
        private defaultHeight = 600, private argvCallback: (argv: string[]) => void = null,
        private createWindowCallback: (win: BrowserWindow) => void, private accountService: AccountService) { }

    init(): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            try {
                if (!isMacAppStore() && !isSnapStore()) {
                    const gotTheLock = app.requestSingleInstanceLock();
                    if (!gotTheLock) {
                        app.quit();
                        return;
                    } else {
                        app.on('second-instance', (event, argv, workingDirectory) => {
                            // Someone tried to run a second instance, we should focus our window.
                            if (this.win != null) {
                                if (this.win.isMinimized() || !this.win.isVisible()) {
                                    this.win.show();
                                }
                                this.win.focus();
                            }
                            if (process.platform === 'win32' || process.platform === 'linux') {
                                if (this.argvCallback != null) {
                                    this.argvCallback(argv);
                                }
                            }
                        });
                    }
                }

                // This method will be called when Electron is shutting
                // down the application.
                app.on('before-quit', () => {
                    this.isQuitting = true;
                });

                // This method will be called when Electron has finished
                // initialization and is ready to create browser windows.
                // Some APIs can only be used after this event occurs.
                app.on('ready', async () => {
                    await this.createWindow();
                    resolve();
                    if (this.argvCallback != null) {
                        this.argvCallback(process.argv);
                    }
                });

                // Quit when all windows are closed.
                app.on('window-all-closed', () => {
                    // On OS X it is common for applications and their menu bar
                    // to stay active until the user quits explicitly with Cmd + Q
                    if (process.platform !== 'darwin' || this.isQuitting || isMacAppStore()) {
                        app.quit();
                    }
                });

                app.on('activate', async () => {
                    // On OS X it's common to re-create a window in the app when the
                    // dock icon is clicked and there are no other windows open.
                    if (this.win === null) {
                        await this.createWindow();
                    } else {
                        // Show the window when clicking on Dock icon
                        this.win.show();
                    }
                });

            } catch (e) {
                // Catch Error
                // throw e;
                reject(e);
            }
        });
    }

    async createWindow(): Promise<void> {
        this.windowStates[StorageKey.MainWindowSize] = await this.getWindowState(StorageKey.MainWindowSize, this.defaultWidth,
            this.defaultHeight);
        this.enableAlwaysOnTop = await this.accountService.getSetting<boolean>(StorageKey.EnableAlwaysOnTopKey);

        // Create the browser window.
        this.win = new BrowserWindow({
            width: this.windowStates[StorageKey.MainWindowSize].width,
            height: this.windowStates[StorageKey.MainWindowSize].height,
            minWidth: 680,
            minHeight: 500,
            x: this.windowStates[StorageKey.MainWindowSize].x,
            y: this.windowStates[StorageKey.MainWindowSize].y,
            title: app.name,
            icon: process.platform === 'linux' ? path.join(__dirname, '/images/icon.png') : undefined,
            titleBarStyle: this.hideTitleBar && process.platform === 'darwin' ? 'hiddenInset' : undefined,
            show: false,
            backgroundColor: '#fff',
            alwaysOnTop: this.enableAlwaysOnTop,
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
                backgroundThrottling: false,
                enableRemoteModule: true, // TODO: This needs to be removed prior to Electron 14.
            },
        });

        if (this.windowStates[StorageKey.MainWindowSize].isMaximized) {
            this.win.maximize();
        }

        // Show it later since it might need to be maximized.
        this.win.show();

        // and load the index.html of the app.
        this.win.loadURL(url.format({
            protocol: 'file:',
            pathname: path.join(__dirname, '/index.html'),
            slashes: true,
        }), {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            });

        // Open the DevTools.
        if (isDev()) {
            this.win.webContents.openDevTools();
        }

        // Emitted when the window is closed.
        this.win.on('closed', async () => {
            await this.updateWindowState(StorageKey.MainWindowSize, this.win);

            // Dereference the window object, usually you would store window
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.win = null;
        });

        this.win.on('close', async () => {
            await this.updateWindowState(StorageKey.MainWindowSize, this.win);
        });

        this.win.on('maximize', async () => {
            await this.updateWindowState(StorageKey.MainWindowSize, this.win);
        });

        this.win.on('unmaximize', async () => {
            await this.updateWindowState(StorageKey.MainWindowSize, this.win);
        });

        this.win.on('resize', () => {
            this.windowStateChangeHandler(StorageKey.MainWindowSize, this.win);
        });

        this.win.on('move', () => {
            this.windowStateChangeHandler(StorageKey.MainWindowSize, this.win);
        });
        this.win.on('focus', () => {
            this.win.webContents.send('messagingService', {
                command: 'windowIsFocused',
                windowIsFocused: true,
            });
        });

        if (this.createWindowCallback) {
            this.createWindowCallback(this.win);
        }
    }

    async toggleAlwaysOnTop() {
        this.enableAlwaysOnTop = !this.win.isAlwaysOnTop();
        this.win.setAlwaysOnTop(this.enableAlwaysOnTop);
        await this.accountService.saveSetting(StorageKey.EnableAlwaysOnTopKey, this.enableAlwaysOnTop);
    }

    private windowStateChangeHandler(configKey: string, win: BrowserWindow) {
        global.clearTimeout(this.windowStateChangeTimer);
        this.windowStateChangeTimer = global.setTimeout(async () => {
            await this.updateWindowState(configKey, win);
        }, WindowEventHandlingDelay);
    }

    private async updateWindowState(configKey: string, win: BrowserWindow) {
        if (win == null) {
            return;
        }

        try {
            const bounds = win.getBounds();

            if (this.windowStates[configKey] == null) {
                this.windowStates[configKey] = await this.accountService.getSetting<any>(configKey);
                if (this.windowStates[configKey] == null) {
                    this.windowStates[configKey] = {};
                }
            }

            this.windowStates[configKey].isMaximized = win.isMaximized();
            this.windowStates[configKey].displayBounds = screen.getDisplayMatching(bounds).bounds;

            if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) {
                this.windowStates[configKey].x = bounds.x;
                this.windowStates[configKey].y = bounds.y;
                this.windowStates[configKey].width = bounds.width;
                this.windowStates[configKey].height = bounds.height;
            }

            await this.accountService.saveSetting(configKey, this.windowStates[configKey]);
        } catch (e) { }
    }

    private async getWindowState(configKey: string, defaultWidth: number, defaultHeight: number) {
        let state = await this.accountService.getSetting<any>(configKey);

        const isValid = state != null && (this.stateHasBounds(state) || state.isMaximized);
        let displayBounds: Electron.Rectangle = null;
        if (!isValid) {
            state = {
                width: defaultWidth,
                height: defaultHeight,
            };

            displayBounds = screen.getPrimaryDisplay().bounds;
        } else if (this.stateHasBounds(state) && state.displayBounds) {
            // Check if the display where the window was last open is still available
            displayBounds = screen.getDisplayMatching(state.displayBounds).bounds;

            if (displayBounds.width !== state.displayBounds.width ||
                displayBounds.height !== state.displayBounds.height ||
                displayBounds.x !== state.displayBounds.x ||
                displayBounds.y !== state.displayBounds.y) {
                state.x = undefined;
                state.y = undefined;
                displayBounds = screen.getPrimaryDisplay().bounds;
            }
        }

        if (displayBounds != null) {
            if (state.width > displayBounds.width && state.height > displayBounds.height) {
                state.isMaximized = true;
            }

            if (state.width > displayBounds.width) {
                state.width = displayBounds.width - 10;
            }
            if (state.height > displayBounds.height) {
                state.height = displayBounds.height - 10;
            }
        }

        return state;
    }

    private stateHasBounds(state: any): boolean {
        return state != null && Number.isInteger(state.x) && Number.isInteger(state.y) &&
            Number.isInteger(state.width) && state.width > 0 && Number.isInteger(state.height) && state.height > 0;
    }
}
