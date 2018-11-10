import { Group, Kdbx } from 'kdbxweb';
import * as kdbxweb from 'kdbxweb';

import { CipherType } from '../enums/cipherType';

import { ApiService } from '../abstractions/api.service';
import { CipherService } from '../abstractions/cipher.service';
import { ExportKdbxService as ExportKdbxServiceAbstraction } from '../abstractions/exportKdbx.service';
import { FolderService } from '../abstractions/folder.service';
import { SearchService } from '../abstractions/search.service';

import { CipherView } from '../models/view/cipherView';
import { CollectionView } from '../models/view/collectionView';
import { FolderView } from '../models/view/folderView';

import { Cipher } from '../models/domain/cipher';
import { Collection } from '../models/domain/collection';

import { CipherData } from '../models/data/cipherData';
import { CollectionData } from '../models/data/collectionData';
import { TreeNode } from '../models/domain/treeNode';
import { CollectionDetailsResponse } from '../models/response/collectionResponse';

export class ExportKdbxService implements ExportKdbxServiceAbstraction {
    constructor(private folderService: FolderService, private cipherService: CipherService,
        private apiService: ApiService, private searchService: SearchService) { }

    async getExport(format: 'kdbx' = 'kdbx'): Promise<ArrayBuffer> {
        const protectedValue = kdbxweb.ProtectedValue.fromString('test1234');
        const credentials = new kdbxweb.Credentials(protectedValue, null);
        const kdbxDb = kdbxweb.Kdbx.create(credentials, 'BitWarden Export');
        const groups = {};
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
        const decCollections: CollectionView[] = [];
        const decCiphers: CipherView[] = [];
        const promises = [];

        promises.push(this.apiService.getCollections(organizationId).then((collections) => {
            const collectionPromises: any = [];
            if (collections != null && collections.data != null && collections.data.length > 0) {
                collections.data.forEach((c) => {
                    const collection = new Collection(new CollectionData(c as CollectionDetailsResponse));
                    collectionPromises.push(collection.decrypt().then((decCol) => {
                        decCollections.push(decCol);
                    }));
                });
            }
            return Promise.all(collectionPromises);
        }));

        promises.push(this.apiService.getCiphersOrganization(organizationId).then((ciphers) => {
            const cipherPromises: any = [];
            if (ciphers != null && ciphers.data != null && ciphers.data.length > 0) {
                ciphers.data.forEach((c) => {
                    const cipher = new Cipher(new CipherData(c));
                    cipherPromises.push(cipher.decrypt().then((decCipher) => {
                        decCiphers.push(decCipher);
                    }));
                });
            }
            return Promise.all(cipherPromises);
        }));

        await Promise.all(promises);

        const collectionsMap = new Map<string, CollectionView>();
        decCollections.forEach((c) => {
            collectionsMap.set(c.id, c);
        });

        const exportCiphers: any[] = [];
        decCiphers.forEach((c) => {
            // only export logins and secure notes
            if (c.type !== CipherType.Login && c.type !== CipherType.SecureNote) {
                return;
            }

            const cipher: any = {};
            cipher.collections = [];
            if (c.collectionIds != null) {
                cipher.collections = c.collectionIds.filter((id) => collectionsMap.has(id))
                    .map((id) => collectionsMap.get(id).name);
            }
            this.buildCommonCipher(cipher, c);
            exportCiphers.push(cipher);
        });

        throw new Error('Not yet implemented');
    }

    getFileName(prefix: string = null): string {
        const now = new Date();
        const dateString =
            now.getFullYear() + '' + this.padNumber(now.getMonth() + 1, 2) + '' + this.padNumber(now.getDate(), 2) +
            this.padNumber(now.getHours(), 2) + '' + this.padNumber(now.getMinutes(), 2) +
            this.padNumber(now.getSeconds(), 2);

        return 'bitwarden' + (prefix ? ('_' + prefix) : '') + '_export_' + dateString + '.csv';
    }

    private padNumber(num: number, width: number, padCharacter: string = '0'): string {
        const numString = num.toString();
        return numString.length >= width ? numString :
            new Array(width - numString.length + 1).join(padCharacter) + numString;
    }

    private buildCommonCipher(cipher: any, c: CipherView) {
        cipher.type = null;
        cipher.name = c.name;
        cipher.notes = c.notes;
        cipher.fields = null;
        // Login props
        cipher.login_uri = null;
        cipher.login_username = null;
        cipher.login_password = null;
        cipher.login_totp = null;

        if (c.fields) {
            c.fields.forEach((f: any) => {
                if (!cipher.fields) {
                    cipher.fields = '';
                } else {
                    cipher.fields += '\n';
                }

                cipher.fields += ((f.name || '') + ': ' + f.value);
            });
        }

        switch (c.type) {
            case CipherType.Login:
                cipher.type = 'login';
                cipher.login_username = c.login.username;
                cipher.login_password = c.login.password;
                cipher.login_totp = c.login.totp;

                if (c.login.uris) {
                    cipher.login_uri = [];
                    c.login.uris.forEach((u) => {
                        cipher.login_uri.push(u.uri);
                    });
                }
                break;
            case CipherType.SecureNote:
                cipher.type = 'note';
                break;
            default:
                return;
        }

        return cipher;
    }

    private createGroup(ciphers: CipherView[], treeNode: TreeNode<FolderView>, database: Kdbx, parentGroup?: Group) {
        parentGroup = parentGroup ? parentGroup : database.getDefaultGroup();
        return new Promise(async (resolve, reject) => {
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
