import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherWithIds } from '../models/export/cipherWithIds';
import { CollectionWithId } from '../models/export/collectionWithId';
import { FolderWithId } from '../models/export/folderWithId';

export class BitwardenJsonImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = JSON.parse(data);
        if (results == null || results.items == null || results.items.length === 0) {
            result.success = false;
            return result;
        }

        const groupingsMap = new Map<string, number>();
        if (this.organization && results.collections != null) {
            results.collections.forEach((c: CollectionWithId) => {
                const collection = CollectionWithId.toView(c);
                if (collection != null) {
                    collection.id = null;
                    collection.organizationId = null;
                    groupingsMap.set(c.id, result.collections.length);
                    result.collections.push(collection);
                }
            });
        } else if (!this.organization && results.folders != null) {
            results.folders.forEach((f: FolderWithId) => {
                const folder = FolderWithId.toView(f);
                if (folder != null) {
                    folder.id = null;
                    groupingsMap.set(f.id, result.folders.length);
                    result.folders.push(folder);
                }
            });
        }

        results.items.forEach((c: CipherWithIds) => {
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
                result.folderRelationships.push([result.ciphers.length, groupingsMap.get(c.folderId)]);
            } else if (this.organization && c.collectionIds != null) {
                c.collectionIds.forEach((cId) => {
                    if (groupingsMap.has(cId)) {
                        result.collectionRelationships.push([result.ciphers.length, groupingsMap.get(cId)]);
                    }
                });
            }

            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
