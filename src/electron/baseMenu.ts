import {
    app,
    clipboard,
    dialog,
    Menu,
    MenuItemConstructorOptions,
} from 'electron';

import { I18nService } from '../abstractions/i18n.service';
import { WindowMain } from './window.main';

import { isMacAppStore } from './utils';

export class BaseMenu {
    protected editMenuItemOptions: MenuItemConstructorOptions;
    protected viewSubMenuItemOptions: MenuItemConstructorOptions[];
    protected windowMenuItemOptions: MenuItemConstructorOptions;
    protected macAppMenuItemOptions: MenuItemConstructorOptions[];
    protected macWindowSubmenuOptions: MenuItemConstructorOptions[];

    constructor(protected i18nService: I18nService, protected windowMain: WindowMain) { }

    protected initProperties() {
        this.editMenuItemOptions = {
            label: this.i18nService.t('edit'),
            submenu: [
                {
                    label: this.i18nService.t('undo'),
                    role: 'undo',
                },
                {
                    label: this.i18nService.t('redo'),
                    role: 'redo',
                },
                { type: 'separator' },
                {
                    label: this.i18nService.t('cut'),
                    role: 'cut',
                },
                {
                    label: this.i18nService.t('copy'),
                    role: 'copy',
                },
                {
                    label: this.i18nService.t('paste'),
                    role: 'paste',
                },
                { type: 'separator' },
                {
                    label: this.i18nService.t('selectAll'),
                    role: 'selectall',
                },
            ],
        };

        this.viewSubMenuItemOptions = [
            {
                label: this.i18nService.t('zoomIn'),
                role: 'zoomin', accelerator: 'CmdOrCtrl+=',
            },
            {
                label: this.i18nService.t('zoomOut'),
                role: 'zoomout', accelerator: 'CmdOrCtrl+-',
            },
            {
                label: this.i18nService.t('resetZoom'),
                role: 'resetzoom', accelerator: 'CmdOrCtrl+0',
            },
            { type: 'separator' },
            {
                label: this.i18nService.t('toggleFullScreen'),
                role: 'togglefullscreen',
            },
            { type: 'separator' },
            {
                label: this.i18nService.t('reload'),
                role: 'forcereload',
            },
            {
                label: this.i18nService.t('toggleDevTools'),
                role: 'toggledevtools',
                accelerator: 'F12',
            },
        ];

        this.windowMenuItemOptions = {
            label: this.i18nService.t('window'),
            role: 'window',
            submenu: [
                {
                    label: this.i18nService.t('minimize'),
                    role: 'minimize',
                },
                {
                    label: this.i18nService.t('close'),
                    role: 'close',
                },
            ],
        };

        if (process.platform === 'darwin') {
            this.macAppMenuItemOptions = [
                {
                    label: this.i18nService.t('services'),
                    role: 'services', submenu: [],
                },
                { type: 'separator' },
                {
                    label: this.i18nService.t('hideBitwarden'),
                    role: 'hide',
                },
                {
                    label: this.i18nService.t('hideOthers'),
                    role: 'hideothers',
                },
                {
                    label: this.i18nService.t('showAll'),
                    role: 'unhide',
                },
                { type: 'separator' },
                {
                    label: this.i18nService.t('quitBitwarden'),
                    role: 'quit',
                },
            ];

            this.macWindowSubmenuOptions = [
                {
                    label: this.i18nService.t('minimize'),
                    role: 'minimize',
                },
                {
                    label: this.i18nService.t('zoom'),
                    role: 'zoom',
                },
                { type: 'separator' },
                {
                    label: this.i18nService.t('bringAllToFront'),
                    role: 'front',
                },
                {
                    label: this.i18nService.t('close'),
                    role: isMacAppStore() ? 'quit' : 'close',
                },
            ];
        }
    }

    protected initContextMenu() {
        if (this.windowMain.win == null) {
            return;
        }

        const selectionMenu = Menu.buildFromTemplate([
            {
                label: this.i18nService.t('copy'),
                role: 'copy',
            },
            { type: 'separator' },
            {
                label: this.i18nService.t('selectAll'),
                role: 'selectall',
            },
        ]);

        const inputMenu = Menu.buildFromTemplate([
            {
                label: this.i18nService.t('undo'),
                role: 'undo',
            },
            {
                label: this.i18nService.t('redo'),
                role: 'redo',
            },
            { type: 'separator' },
            {
                label: this.i18nService.t('cut'),
                role: 'cut',
                enabled: false,
            },
            {
                label: this.i18nService.t('copy'),
                role: 'copy',
                enabled: false,
            },
            {
                label: this.i18nService.t('paste'),
                role: 'paste',
            },
            { type: 'separator' },
            {
                label: this.i18nService.t('selectAll'),
                role: 'selectall',
            },
        ]);

        const inputSelectionMenu = Menu.buildFromTemplate([
            {
                label: this.i18nService.t('cut'),
                role: 'cut',
            },
            {
                label: this.i18nService.t('copy'),
                role: 'copy',
            },
            {
                label: this.i18nService.t('paste'),
                role: 'paste',
            },
            { type: 'separator' },
            {
                label: this.i18nService.t('selectAll'),
                role: 'selectall',
            },
        ]);

        this.windowMain.win.webContents.on('context-menu', (e, props) => {
            const selected = props.selectionText && props.selectionText.trim() !== '';
            if (props.isEditable && selected) {
                inputSelectionMenu.popup({ window: this.windowMain.win });
            } else if (props.isEditable) {
                inputMenu.popup({ window: this.windowMain.win });
            } else if (selected) {
                selectionMenu.popup({ window: this.windowMain.win });
            }
        });
    }
}
