import { Group, Kdbx } from 'kdbxweb';
import * as kdbxweb from 'kdbxweb';

import { CipherType } from '../enums/cipherType';

import { ApiService } from '../abstractions/api.service';
import { CipherService } from '../abstractions/cipher.service';
import { ExportKdbxService as ExportKdbxServiceAbstraction } from '../abstractions/exportKdbx.service';
import { FolderService } from '../abstractions/folder.service';
import { SearchService } from '../abstractions/search.service';

import { CipherView } from '../models/view/cipherView';
import { FolderView } from '../models/view/folderView';

import { TreeNode } from '../models/domain/treeNode';

export class ExportKdbxService implements ExportKdbxServiceAbstraction {
    constructor(private folderService: FolderService, private cipherService: CipherService,
        private apiService: ApiService, private searchService: SearchService) { }

    async getExport(format: 'kdbx' = 'kdbx'): Promise<ArrayBuffer> {
        const protectedValue = kdbxweb.ProtectedValue.fromString('test1234');
        const credentials = new kdbxweb.Credentials(protectedValue, null);
        const kdbxDb = kdbxweb.Kdbx.create(credentials, 'BitWarden Export');
        let decFolders: Array<TreeNode<FolderView>> = [];
        let decCiphers: CipherView[] = [];
        const promises = [];

        promises.push(this.cipherService.getAllDecrypted().then((ciphers) => {
            decCiphers = ciphers;
        }));

        promises.push(this.folderService.getAllNested().then((folders) => {
            decFolders = folders;
        }));

        await Promise.all(promises);

        const entryPromises = [];

        for (const folder of decFolders) {
            entryPromises.push(this.createGroup(decCiphers, folder, kdbxDb));
        }

        await Promise.all(entryPromises);

        return await kdbxDb.save();
    }

    async getOrganizationExport(organizationId: string, format: 'kdbx' = 'kdbx'): Promise<string> {
        throw new Error('Not yet implemented');
    }

    getFileName(prefix: string = null): string {
        const now = new Date();
        const dateString =
            now.getFullYear() + '' + this.padNumber(now.getMonth() + 1, 2) + '' + this.padNumber(now.getDate(), 2) +
            this.padNumber(now.getHours(), 2) + '' + this.padNumber(now.getMinutes(), 2) +
            this.padNumber(now.getSeconds(), 2);

        return 'bitwarden' + (prefix ? ('_' + prefix) : '') + '_export_' + dateString + '.kdbx';
    }

    private padNumber(num: number, width: number, padCharacter: string = '0'): string {
        const numString = num.toString();
        return numString.length >= width ? numString :
            new Array(width - numString.length + 1).join(padCharacter) + numString;
    }

    private createGroup(ciphers: CipherView[], treeNode: TreeNode<FolderView>, database: Kdbx, parentGroup?: Group) {
        parentGroup = parentGroup ? parentGroup : database.getDefaultGroup();
        return new Promise(async (resolve) => {
            const promises = [];
            const filteredCiphers = ciphers.filter((c) => {
                if (treeNode.node.id === c.folderId) {
                    return true;
                }
                return false;
            });
            const group = database.createGroup(parentGroup, treeNode.node.name);
            for (const cipher of filteredCiphers) {
                const entry = database.createEntry(group);
                entry.fields.Title = cipher.name;
                if (cipher.type === CipherType.Login) {
                    entry.fields.UserName = cipher.login.username;
                    entry.fields.Password = kdbxweb.ProtectedValue.fromString(cipher.login.password);
                    entry.fields.Notes = cipher.notes;
                    if (cipher.login.uris) {
                        const httpUris = cipher.login.uris.filter((c) => {
                            if (c.uri === null) {
                                return false;
                            }
                            return c.uri.startsWith('http');
                        });
                        if (httpUris.length) {
                            entry.fields.URL = httpUris[0].uri;
                        }
                    }
                    entry.fields.Uris = cipher.login.uris ? cipher.login.uris.map((u) => u.uri).join('\n') : null;
                }
            }
            for (const child of treeNode.children) {
                promises.push(this.createGroup(ciphers, child, database, group));
            }
            await Promise.all(promises);
            resolve();
        });
    }
}
