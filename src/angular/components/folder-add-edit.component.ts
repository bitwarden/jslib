import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { FolderService } from '../../abstractions/folder.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { FolderView } from '../../models/view/folderView';

export class FolderAddEditComponent implements OnInit {
    @Input() folderId: string;
    @Output() onSavedFolder = new EventEmitter<FolderView>();
    @Output() onDeletedFolder = new EventEmitter<FolderView>();

    editMode: boolean = false;
    folder: FolderView = new FolderView();
    title: string;
    formPromise: Promise<any>;
    deletePromise: Promise<any>;

    constructor(protected folderService: FolderService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService) { }

    async ngOnInit() {
        await this.init();
    }

    async submit(): Promise<boolean> {
        if (this.folder.name == null || this.folder.name === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nameRequired'));
            return false;
        }

        try {
            const folder = await this.folderService.encrypt(this.folder);
            this.formPromise = this.folderService.saveWithServer(folder);
            await this.formPromise;
            this.platformUtilsService.eventTrack(this.editMode ? 'Edited Folder' : 'Added Folder');
            this.platformUtilsService.showToast('success', null,
                this.i18nService.t(this.editMode ? 'editedFolder' : 'addedFolder'));
            this.onSavedFolder.emit(this.folder);
            return true;
        } catch { }

        return false;
    }

    async delete(): Promise<boolean> {
        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('deleteFolderConfirmation'), this.i18nService.t('deleteFolder'),
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!confirmed) {
            return false;
        }

        try {
            this.deletePromise = this.folderService.deleteWithServer(this.folder.id);
            await this.deletePromise;
            this.platformUtilsService.eventTrack('Deleted Folder');
            this.platformUtilsService.showToast('success', null, this.i18nService.t('deletedFolder'));
            this.onDeletedFolder.emit(this.folder);
        } catch { }

        return true;
    }

    protected async init() {
        this.editMode = this.folderId != null;

        if (this.editMode) {
            this.editMode = true;
            this.title = this.i18nService.t('editFolder');
            const folder = await this.folderService.get(this.folderId);
            this.folder = await folder.decrypt();
        } else {
            this.title = this.i18nService.t('addFolder');
        }
    }
}
