import { app, BrowserWindow, screen } from 'electron';
import { ElectronConstants } from './electronConstants';

import * as path from 'path';
import * as url from 'url';

import { isDev, isMacAppStore, isSnapStore } from './utils';

import { StorageService } from '../abstractions/storage.service';

const WindowEventHandlingDelay = 100;
const Keys = {
    mainWindowSize: 'mainWindowSize',
};

export class WindowMain {
    win: BrowserWindow;
    isQuitting: boolean = false;

    private windowStateChangeTimer: NodeJS.Timer;
    private windowStates: { [key: string]: any; } = {};
    private enableAlwaysOnTop: boolean = false;

    constructor(private storageService: StorageService, private hideTitleBar = false,
        private defaultWidth = 950, private defaultHeight = 600) { }

    init(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                if (!isMacAppStore() && !isSnapStore()) {
                    const gotTheLock = app.requestSingleInstanceLock();
                    if (!gotTheLock) {
                        app.quit();
                        return;
                    } else {
                        app.on('second-instance', (event, commandLine, workingDirectory) => {
                            // Someone tried to run a second instance, we should focus our window.
                            if (this.win != null) {
                                if (this.win.isMinimized() || !this.win.isVisible()) {
                                    this.win.show();
                                }
                                this.win.focus();
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
                });

                // Quit when all windows are closed.
                app.on('window-all-closed', () => {
                    // On OS X it is common for applications and their menu bar
                    // to stay active until the user quits explicitly with Cmd + Q
                    if (process.platform !== 'darwin' || isMacAppStore()) {
                        app.quit();
                    }
                });

                app.on('activate', async () => {
                    // On OS X it's common to re-create a window in the app when the
                    // dock icon is clicked and there are no other windows open.
                    if (this.win === null) {
                        await this.createWindow();
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
        this.windowStates[Keys.mainWindowSize] = await this.getWindowState(Keys.mainWindowSize, this.defaultWidth,
            this.defaultHeight);
        this.enableAlwaysOnTop = await this.storageService.get<boolean>(ElectronConstants.enableAlwaysOnTopKey);

        // Create the browser window.
        this.win = new BrowserWindow({
            width: this.windowStates[Keys.mainWindowSize].width,
            height: this.windowStates[Keys.mainWindowSize].height,
            minWidth: 680,
            minHeight: 500,
            x: this.windowStates[Keys.mainWindowSize].x,
            y: this.windowStates[Keys.mainWindowSize].y,
            title: app.getName(),
            icon: process.platform === 'linux' ? path.join(__dirname, '/images/icon.png') : undefined,
            titleBarStyle: this.hideTitleBar && process.platform === 'darwin' ? 'hiddenInset' : undefined,
            show: false,
            alwaysOnTop: this.enableAlwaysOnTop,
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
            },
        });

        if (this.windowStates[Keys.mainWindowSize].isMaximized) {
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
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0',
            });

        // Open the DevTools.
        if (isDev()) {
            this.win.webContents.openDevTools();
        }

        // Emitted when the window is closed.
        this.win.on('closed', async () => {
            await this.updateWindowState(Keys.mainWindowSize, this.win);

            // Dereference the window object, usually you would store window
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.win = null;
        });

        this.win.on('close', async () => {
            await this.updateWindowState(Keys.mainWindowSize, this.win);
        });

        this.win.on('maximize', async () => {
            await this.updateWindowState(Keys.mainWindowSize, this.win);
        });

        this.win.on('unmaximize', async () => {
            await this.updateWindowState(Keys.mainWindowSize, this.win);
        });

        this.win.on('resize', () => {
            this.windowStateChangeHandler(Keys.mainWindowSize, this.win);
        });

        this.win.on('move', () => {
            this.windowStateChangeHandler(Keys.mainWindowSize, this.win);
        });

    }

    async toggleAlwaysOnTop() {
        this.enableAlwaysOnTop = !this.win.isAlwaysOnTop();
        this.win.setAlwaysOnTop(this.enableAlwaysOnTop);
        await this.storageService.save(ElectronConstants.enableAlwaysOnTopKey, this.enableAlwaysOnTop);
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
                this.windowStates[configKey] = await this.storageService.get<any>(configKey);
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

            await this.storageService.save(configKey, this.windowStates[configKey]);
        } catch (e) { }
    }

    private async getWindowState(configKey: string, defaultWidth: number, defaultHeight: number) {
        let state = await this.storageService.get<any>(configKey);

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
