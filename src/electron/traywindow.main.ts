import {
    app,
    BrowserWindow,
    screen,
    Tray,
} from 'electron';
import * as path from 'path';
import * as url from 'url';

export class TrayWindowMain {
    window: BrowserWindow;

    width: number = 800;
    height: number = 300;

    constructor() {
        app.on('ready', async () => {
            await this.createWindow();
        });
    }

    async createWindow(): Promise<void> {
        this.window = new BrowserWindow({
            width: this.width,
            height: this.height,
            show: false,
            frame: false,
            fullscreenable: false,
            resizable: false,
            transparent: true,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
                backgroundThrottling: false,
            }
        });

        this.window.on('blur', () => {
            this.window.hide();
        });

        this.window.loadURL(url.format({
            protocol: 'file:',
            pathname: path.join(__dirname, '/index.html'),
            slashes: true,
        }), {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            });
    }

    toggleWindow(tray: Tray) {
        if (this.window.isVisible())
            return this.window.hide();

        const cursorPos = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(cursorPos);
        const windowBounds = this.window.getBounds();
        const trayBounds = tray.getBounds();

        const maxPosX = (display.bounds.width - this.width) - 10;

        if (process.platform === 'win32') {
            this.window.setPosition(
                Math.round(Math.min(maxPosX, trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))),
                Math.round(trayBounds.y - trayBounds.height - windowBounds.height),
                false
            );
        } else if (process.platform === 'darwin') {
            this.window.setPosition(
                Math.round(Math.min(maxPosX, trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))),
                Math.round(trayBounds.y + trayBounds.height + 3),
                false
            );
        }

        // this.window.webContents.openDevTools({ mode: 'detach' });

        this.window.show();
        this.window.focus();
    }
}