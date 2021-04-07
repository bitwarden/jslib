import { ipcRenderer } from 'electron';

export type RendererMenuItem = {label?: string, type?: ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'), click?: () => any};

export function invokeMenu(menu: RendererMenuItem[]) {
    const menuWithoutClick = menu.map(m => {
        return { label: m.label, type: m.type };
    });
    ipcRenderer.invoke('openContextMenu', { menu: menuWithoutClick }).then((i: number) => {
        if (i !== -1) {
            menu[i].click();
        }
    });
}

export function isDev() {
    // ref: https://github.com/sindresorhus/electron-is-dev
    if ('ELECTRON_IS_DEV' in process.env) {
        return parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
    }
    return (process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath));
}

export function isAppImage() {
    return process.platform === 'linux' && 'APPIMAGE' in process.env;
}

export function isMacAppStore() {
    return process.platform === 'darwin' && process.mas && process.mas === true;
}

export function isWindowsStore() {
    const isWindows = process.platform === 'win32';
    let windowsStore = process.windowsStore;
    if (isWindows && !windowsStore &&
        process.resourcesPath.indexOf('8bitSolutionsLLC.bitwardendesktop_') > -1) {
        windowsStore = true;
    }
    return isWindows && windowsStore === true;
}

export function isSnapStore() {
    return process.platform === 'linux' && process.env.SNAP_USER_DATA != null;
}

export function isWindowsPortable() {
    return process.platform === 'win32' && process.env.PORTABLE_EXECUTABLE_DIR != null;
}
