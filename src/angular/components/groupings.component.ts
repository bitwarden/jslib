import {
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { CipherType } from '../../enums/cipherType';

import { CollectionView } from '../../models/view/collectionView';
import { FolderView } from '../../models/view/folderView';

import { CollectionService } from '../../abstractions/collection.service';
import { FolderService } from '../../abstractions/folder.service';

export class GroupingsComponent {
    @Input() showFolders = true;
    @Input() showCollections = true;
    @Input() showFavorites = true;

    @Output() onAllClicked = new EventEmitter();
    @Output() onFavoritesClicked = new EventEmitter();
    @Output() onCipherTypeClicked = new EventEmitter<CipherType>();
    @Output() onFolderClicked = new EventEmitter<FolderView>();
    @Output() onAddFolder = new EventEmitter();
    @Output() onEditFolder = new EventEmitter<FolderView>();
    @Output() onCollectionClicked = new EventEmitter<CollectionView>();

    folders: FolderView[];
    collections: CollectionView[];
    loaded: boolean = false;
    cipherType = CipherType;
    selectedAll: boolean = false;
    selectedFavorites: boolean = false;
    selectedType: CipherType = null;
    selectedFolder: boolean = false;
    selectedFolderId: string = null;
    selectedCollectionId: string = null;

    constructor(protected collectionService: CollectionService, protected folderService: FolderService) { }

    async load(setLoaded = true) {
        await this.loadFolders();
        await this.loadCollections();

        if (setLoaded) {
            this.loaded = true;
        }
    }

    async loadCollections(organizationId?: string) {
        if (!this.showCollections) {
            return;
        }
        const collections = await this.collectionService.getAllDecrypted();
        if (organizationId != null) {
            this.collections = collections.filter((c) => c.organizationId === organizationId);
        } else {
            this.collections = collections;
        }
    }

    async loadFolders() {
        if (!this.showFolders) {
            return;
        }
        this.folders = await this.folderService.getAllDecrypted();
    }

    selectAll() {
        this.clearSelections();
        this.selectedAll = true;
        this.onAllClicked.emit();
    }

    selectFavorites() {
        this.clearSelections();
        this.selectedFavorites = true;
        this.onFavoritesClicked.emit();
    }

    selectType(type: CipherType) {
        this.clearSelections();
        this.selectedType = type;
        this.onCipherTypeClicked.emit(type);
    }

    selectFolder(folder: FolderView) {
        this.clearSelections();
        this.selectedFolder = true;
        this.selectedFolderId = folder.id;
        this.onFolderClicked.emit(folder);
    }

    addFolder() {
        this.onAddFolder.emit();
    }

    editFolder(folder: FolderView) {
        this.onEditFolder.emit(folder);
    }

    selectCollection(collection: CollectionView) {
        this.clearSelections();
        this.selectedCollectionId = collection.id;
        this.onCollectionClicked.emit(collection);
    }

    clearSelections() {
        this.selectedAll = false;
        this.selectedFavorites = false;
        this.selectedType = null;
        this.selectedFolder = false;
        this.selectedFolderId = null;
        this.selectedCollectionId = null;
    }
}
