import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherWithIds } from '../models/export/cipherWithIds';
import { CollectionWithId } from '../models/export/collectionWithId';
import { FolderWithId } from '../models/export/folderWithId';

export class BitwardenJsonImporter extends BaseImporter implements Importer {
    private results: any;
    private result: ImportResult;

    async parse(data: string): Promise<ImportResult> {
        this.result = new ImportResult();
        this.results = JSON.parse(data);
        if (this.results == null || this.results.items == null || this.results.items.length === 0) {
            this.result.success = false;
            return this.result;
        }

        if (this.results.encrypted) {
            await this.parseEncrypted();
        } else {
            this.parseDecrypted();
        }

        this.result.success = true;
        return this.result;
    }

    private async parseEncrypted() {
        const groupingsMap = new Map<string, number>();

        if (this.organization && this.results.collections != null) {
            for (const c of this.results.collections as CollectionWithId[]) {
                const collection = CollectionWithId.toDomain(c);
                if (collection != null) {
                    collection.id = null;
                    collection.organizationId = this.organizationId;
                    const view = await collection.decrypt();
                    groupingsMap.set(c.id, this.result.collections.length);
                    this.result.collections.push(view);
                }
            }
        } else if (!this.organization && this.results.folders != null) {
            for (const f of this.results.folders as FolderWithId[]) {
                const folder = FolderWithId.toDomain(f);
                if (folder != null) {
                    folder.id = null;
                    const view = await folder.decrypt();
                    groupingsMap.set(f.id, this.result.folders.length);
                    this.result.folders.push(view);
                }
            }
        }

        for (const c of this.results.items as CipherWithIds[]) {
            const cipher = CipherWithIds.toDomain(c);
            // reset ids incase they were set for some reason
            cipher.id = null;
            cipher.folderId = null;
            cipher.organizationId = this.organizationId;
            cipher.collectionIds = null;

            // make sure password history is limited
            if (cipher.passwordHistory != null && cipher.passwordHistory.length > 5) {
                cipher.passwordHistory = cipher.passwordHistory.slice(0, 5);
            }

            if (!this.organization && c.folderId != null && groupingsMap.has(c.folderId)) {
                this.result.folderRelationships.push([this.result.ciphers.length, groupingsMap.get(c.folderId)]);
            } else if (this.organization && c.collectionIds != null) {
                c.collectionIds.forEach((cId) => {
                    if (groupingsMap.has(cId)) {
                        this.result.collectionRelationships.push([this.result.ciphers.length, groupingsMap.get(cId)]);
                    }
                });
            }

            const view = await cipher.decrypt();
            this.cleanupCipher(view);
            this.result.ciphers.push(view);
        }
    }

    private parseDecrypted() {
        const groupingsMap = new Map<string, number>();
        if (this.organization && this.results.collections != null) {
            this.results.collections.forEach((c: CollectionWithId) => {
                const collection = CollectionWithId.toView(c);
                if (collection != null) {
                    collection.id = null;
                    collection.organizationId = null;
                    groupingsMap.set(c.id, this.result.collections.length);
                    this.result.collections.push(collection);
                }
            });
        } else if (!this.organization && this.results.folders != null) {
            this.results.folders.forEach((f: FolderWithId) => {
                const folder = FolderWithId.toView(f);
                if (folder != null) {
                    folder.id = null;
                    groupingsMap.set(f.id, this.result.folders.length);
                    this.result.folders.push(folder);
                }
            });
        }

        this.results.items.forEach((c: CipherWithIds) => {
            const cipher = CipherWithIds.toView(c);
            // reset ids incase they were set for some reason
            cipher.id = null;
            cipher.folderId = null;
            cipher.organizationId = null;
            cipher.collectionIds = null;

            // make sure password history is limited
            if (cipher.passwordHistory != null && cipher.passwordHistory.length > 5) {
                cipher.passwordHistory = cipher.passwordHistory.slice(0, 5);
            }

            if (!this.organization && c.folderId != null && groupingsMap.has(c.folderId)) {
                this.result.folderRelationships.push([this.result.ciphers.length, groupingsMap.get(c.folderId)]);
            } else if (this.organization && c.collectionIds != null) {
                c.collectionIds.forEach((cId) => {
                    if (groupingsMap.has(cId)) {
                        this.result.collectionRelationships.push([this.result.ciphers.length, groupingsMap.get(cId)]);
                    }
                });
            }

            this.cleanupCipher(cipher);
            this.result.ciphers.push(cipher);
        });
    }
}
