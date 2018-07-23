import { CipherType } from '../enums/cipherType';
import { UriMatchType } from '../enums/uriMatchType';

import { CipherData } from '../models/data/cipherData';

import { Attachment } from '../models/domain/attachment';
import { Card } from '../models/domain/card';
import { Cipher } from '../models/domain/cipher';
import { CipherString } from '../models/domain/cipherString';
import Domain from '../models/domain/domain';
import { Field } from '../models/domain/field';
import { Identity } from '../models/domain/identity';
import { Login } from '../models/domain/login';
import { LoginUri } from '../models/domain/loginUri';
import { SecureNote } from '../models/domain/secureNote';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { CipherBulkDeleteRequest } from '../models/request/cipherBulkDeleteRequest';
import { CipherBulkMoveRequest } from '../models/request/cipherBulkMoveRequest';
import { CipherBulkShareRequest } from '../models/request/cipherBulkShareRequest';
import { CipherCollectionsRequest } from '../models/request/cipherCollectionsRequest';
import { CipherRequest } from '../models/request/cipherRequest';
import { CipherShareRequest } from '../models/request/cipherShareRequest';

import { CipherResponse } from '../models/response/cipherResponse';
import { ErrorResponse } from '../models/response/errorResponse';

import { AttachmentView } from '../models/view/attachmentView';
import { CipherView } from '../models/view/cipherView';
import { FieldView } from '../models/view/fieldView';
import { View } from '../models/view/view';

import { ApiService } from '../abstractions/api.service';
import { CipherService as CipherServiceAbstraction } from '../abstractions/cipher.service';
import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { SettingsService } from '../abstractions/settings.service';
import { StorageService } from '../abstractions/storage.service';
import { UserService } from '../abstractions/user.service';

import { Utils } from '../misc/utils';

const Keys = {
    ciphersPrefix: 'ciphers_',
    localData: 'sitesLocalData',
    neverDomains: 'neverDomains',
};

export class CipherService implements CipherServiceAbstraction {
    decryptedCipherCache: CipherView[];

    constructor(private cryptoService: CryptoService, private userService: UserService,
        private settingsService: SettingsService, private apiService: ApiService,
        private storageService: StorageService, private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService) {
    }

    clearCache(): void {
        this.decryptedCipherCache = null;
    }

    async encrypt(model: CipherView, key?: SymmetricCryptoKey): Promise<Cipher> {
        const cipher = new Cipher();
        cipher.id = model.id;
        cipher.folderId = model.folderId;
        cipher.favorite = model.favorite;
        cipher.organizationId = model.organizationId;
        cipher.type = model.type;
        cipher.collectionIds = model.collectionIds;

        if (key == null && cipher.organizationId != null) {
            key = await this.cryptoService.getOrgKey(cipher.organizationId);
        }
        await Promise.all([
            this.encryptObjProperty(model, cipher, {
                name: null,
                notes: null,
            }, key),
            this.encryptCipherData(cipher, model, key),
            this.encryptFields(model.fields, key).then((fields) => {
                cipher.fields = fields;
            }),
            this.encryptAttachments(model.attachments, key).then((attachments) => {
                cipher.attachments = attachments;
            }),
        ]);

        return cipher;
    }

    async encryptAttachments(attachmentsModel: AttachmentView[], key: SymmetricCryptoKey): Promise<Attachment[]> {
        if (attachmentsModel == null || attachmentsModel.length === 0) {
            return null;
        }

        const promises: Array<Promise<any>> = [];
        const encAttachments: Attachment[] = [];
        attachmentsModel.forEach(async (model) => {
            const attachment = new Attachment();
            attachment.id = model.id;
            attachment.size = model.size;
            attachment.sizeName = model.sizeName;
            attachment.url = model.url;
            const promise = this.encryptObjProperty(model, attachment, {
                fileName: null,
            }, key).then(() => {
                encAttachments.push(attachment);
            });
            promises.push(promise);
        });

        await Promise.all(promises);
        return encAttachments;
    }

    async encryptFields(fieldsModel: FieldView[], key: SymmetricCryptoKey): Promise<Field[]> {
        if (!fieldsModel || !fieldsModel.length) {
            return null;
        }

        const self = this;
        const encFields: Field[] = [];
        await fieldsModel.reduce((promise, field) => {
            return promise.then(() => {
                return self.encryptField(field, key);
            }).then((encField: Field) => {
                encFields.push(encField);
            });
        }, Promise.resolve());

        return encFields;
    }

    async encryptField(fieldModel: FieldView, key: SymmetricCryptoKey): Promise<Field> {
        const field = new Field();
        field.type = fieldModel.type;

        await this.encryptObjProperty(fieldModel, field, {
            name: null,
            value: null,
        }, key);

        return field;
    }

    async get(id: string): Promise<Cipher> {
        const userId = await this.userService.getUserId();
        const localData = await this.storageService.get<any>(Keys.localData);
        const ciphers = await this.storageService.get<{ [id: string]: CipherData; }>(
            Keys.ciphersPrefix + userId);
        if (ciphers == null || !ciphers.hasOwnProperty(id)) {
            return null;
        }

        return new Cipher(ciphers[id], false, localData ? localData[id] : null);
    }

    async getAll(): Promise<Cipher[]> {
        const userId = await this.userService.getUserId();
        const localData = await this.storageService.get<any>(Keys.localData);
        const ciphers = await this.storageService.get<{ [id: string]: CipherData; }>(
            Keys.ciphersPrefix + userId);
        const response: Cipher[] = [];
        for (const id in ciphers) {
            if (ciphers.hasOwnProperty(id)) {
                response.push(new Cipher(ciphers[id], false, localData ? localData[id] : null));
            }
        }
        return response;
    }

    async getAllDecrypted(): Promise<CipherView[]> {
        if (this.decryptedCipherCache != null) {
            return this.decryptedCipherCache;
        }

        const decCiphers: CipherView[] = [];
        const hasKey = await this.cryptoService.hasKey();
        if (!hasKey) {
            throw new Error('No key.');
        }

        const promises: any[] = [];
        const ciphers = await this.getAll();
        ciphers.forEach((cipher) => {
            promises.push(cipher.decrypt().then((c) => decCiphers.push(c)));
        });

        await Promise.all(promises);
        decCiphers.sort(this.getLocaleSortingFunction());
        this.decryptedCipherCache = decCiphers;
        return this.decryptedCipherCache;
    }

    async getAllDecryptedForGrouping(groupingId: string, folder: boolean = true): Promise<CipherView[]> {
        const ciphers = await this.getAllDecrypted();

        return ciphers.filter((cipher) => {
            if (folder && cipher.folderId === groupingId) {
                return true;
            } else if (!folder && cipher.collectionIds != null && cipher.collectionIds.indexOf(groupingId) > -1) {
                return true;
            }

            return false;
        });
    }

    async getAllDecryptedForUrl(url: string, includeOtherTypes?: CipherType[]): Promise<CipherView[]> {
        if (url == null && !includeOtherTypes) {
            return Promise.resolve([]);
        }

        const domain = this.platformUtilsService.getDomain(url);
        const eqDomainsPromise = domain == null ? Promise.resolve([]) :
            this.settingsService.getEquivalentDomains().then((eqDomains: any[][]) => {
                let matches: any[] = [];
                eqDomains.forEach((eqDomain) => {
                    if (eqDomain.length && eqDomain.indexOf(domain) >= 0) {
                        matches = matches.concat(eqDomain);
                    }
                });

                if (!matches.length) {
                    matches.push(domain);
                }

                return matches;
            });

        const result = await Promise.all([eqDomainsPromise, this.getAllDecrypted()]);
        const matchingDomains = result[0];
        const ciphers = result[1];

        return ciphers.filter((cipher) => {
            if (includeOtherTypes && includeOtherTypes.indexOf(cipher.type) > -1) {
                return true;
            }

            if (url != null && cipher.type === CipherType.Login && cipher.login.uris != null) {
                for (let i = 0; i < cipher.login.uris.length; i++) {
                    const u = cipher.login.uris[i];
                    if (u.uri == null) {
                        continue;
                    }

                    switch (u.match) {
                        case null:
                        case undefined:
                        case UriMatchType.Domain:
                            if (domain != null && u.domain != null && matchingDomains.indexOf(u.domain) > -1) {
                                return true;
                            }
                            break;
                        case UriMatchType.Host:
                            const urlHost = Utils.getHost(url);
                            if (urlHost != null && urlHost === Utils.getHost(u.uri)) {
                                return true;
                            }
                            break;
                        case UriMatchType.Exact:
                            if (url === u.uri) {
                                return true;
                            }
                            break;
                        case UriMatchType.StartsWith:
                            if (url.startsWith(u.uri)) {
                                return true;
                            }
                            break;
                        case UriMatchType.RegularExpression:
                            try {
                                const regex = new RegExp(u.uri, 'i');
                                if (regex.test(url)) {
                                    return true;
                                }
                            } catch { }
                            break;
                        case UriMatchType.Never:
                        default:
                            break;
                    }
                }
            }

            return false;
        });
    }

    async getLastUsedForUrl(url: string): Promise<CipherView> {
        const ciphers = await this.getAllDecryptedForUrl(url);
        if (ciphers.length === 0) {
            return null;
        }

        const sortedCiphers = ciphers.sort(this.sortCiphersByLastUsed);
        return sortedCiphers[0];
    }

    async updateLastUsedDate(id: string): Promise<void> {
        let ciphersLocalData = await this.storageService.get<any>(Keys.localData);
        if (!ciphersLocalData) {
            ciphersLocalData = {};
        }

        if (ciphersLocalData[id]) {
            ciphersLocalData[id].lastUsedDate = new Date().getTime();
        } else {
            ciphersLocalData[id] = {
                lastUsedDate: new Date().getTime(),
            };
        }

        await this.storageService.save(Keys.localData, ciphersLocalData);

        if (this.decryptedCipherCache == null) {
            return;
        }

        for (let i = 0; i < this.decryptedCipherCache.length; i++) {
            const cached = this.decryptedCipherCache[i];
            if (cached.id === id) {
                cached.localData = ciphersLocalData[id];
                break;
            }
        }
    }

    async saveNeverDomain(domain: string): Promise<void> {
        if (domain == null) {
            return;
        }

        let domains = await this.storageService.get<{ [id: string]: any; }>(Keys.neverDomains);
        if (!domains) {
            domains = {};
        }
        domains[domain] = null;
        await this.storageService.save(Keys.neverDomains, domains);
    }

    async saveWithServer(cipher: Cipher): Promise<any> {
        const request = new CipherRequest(cipher);

        let response: CipherResponse;
        if (cipher.id == null) {
            response = await this.apiService.postCipher(request);
            cipher.id = response.id;
        } else {
            response = await this.apiService.putCipher(cipher.id, request);
        }

        const userId = await this.userService.getUserId();
        const data = new CipherData(response, userId, cipher.collectionIds);
        await this.upsert(data);
    }

    async shareWithServer(cipher: CipherView, organizationId: string, collectionIds: string[]): Promise<any> {
        cipher.organizationId = organizationId;
        cipher.collectionIds = collectionIds;
        const encCipher = await this.encrypt(cipher);
        const request = new CipherShareRequest(encCipher);
        await this.apiService.putShareCipher(cipher.id, request);
        const userId = await this.userService.getUserId();
        await this.upsert(encCipher.toCipherData(userId));
    }

    async shareManyWithServer(ciphers: CipherView[], organizationId: string, collectionIds: string[]): Promise<any> {
        const promises: Array<Promise<any>> = [];
        const encCiphers: Cipher[] = [];
        for (const cipher of ciphers) {
            cipher.organizationId = organizationId;
            cipher.collectionIds = collectionIds;
            promises.push(this.encrypt(cipher).then((c) => {
                encCiphers.push(c);
            }));
        }
        await Promise.all(promises);
        const request = new CipherBulkShareRequest(encCiphers, collectionIds);
        await this.apiService.putShareCiphers(request);
        const userId = await this.userService.getUserId();
        await this.upsert(encCiphers.map((c) => c.toCipherData(userId)));
    }

    async shareAttachmentWithServer(attachmentView: AttachmentView, cipherId: string,
        organizationId: string): Promise<any> {
        const attachmentResponse = await fetch(new Request(attachmentView.url, { cache: 'no-cache' }));
        if (attachmentResponse.status !== 200) {
            throw Error('Failed to download attachment: ' + attachmentResponse.status.toString());
        }

        const buf = await attachmentResponse.arrayBuffer();
        const decBuf = await this.cryptoService.decryptFromBytes(buf, null);
        const key = await this.cryptoService.getOrgKey(organizationId);
        const encData = await this.cryptoService.encryptToBytes(decBuf, key);
        const encFileName = await this.cryptoService.encrypt(attachmentView.fileName, key);

        const fd = new FormData();
        try {
            const blob = new Blob([encData], { type: 'application/octet-stream' });
            fd.append('data', blob, encFileName.encryptedString);
        } catch (e) {
            if (Utils.isNode && !Utils.isBrowser) {
                fd.append('data', new Buffer(encData) as any, {
                    filepath: encFileName.encryptedString,
                    contentType: 'application/octet-stream',
                } as any);
            } else {
                throw e;
            }
        }

        let response: CipherResponse;
        try {
            response = await this.apiService.postShareCipherAttachment(cipherId, attachmentView.id, fd,
                organizationId);
        } catch (e) {
            throw new Error((e as ErrorResponse).getSingleMessage());
        }
    }

    saveAttachmentWithServer(cipher: Cipher, unencryptedFile: any, admin = false): Promise<Cipher> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(unencryptedFile);
            reader.onload = async (evt: any) => {
                try {
                    const cData = await this.saveAttachmentRawWithServer(cipher,
                        unencryptedFile.name, evt.target.result, admin);
                    resolve(cData);
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = (evt) => {
                reject('Error reading file.');
            };
        });
    }

    async saveAttachmentRawWithServer(cipher: Cipher, filename: string,
        data: ArrayBuffer, admin = false): Promise<Cipher> {
        const key = await this.cryptoService.getOrgKey(cipher.organizationId);
        const encFileName = await this.cryptoService.encrypt(filename, key);
        const encData = await this.cryptoService.encryptToBytes(data, key);

        const fd = new FormData();
        try {
            const blob = new Blob([encData], { type: 'application/octet-stream' });
            fd.append('data', blob, encFileName.encryptedString);
        } catch (e) {
            if (Utils.isNode && !Utils.isBrowser) {
                fd.append('data', new Buffer(encData) as any, {
                    filepath: encFileName.encryptedString,
                    contentType: 'application/octet-stream',
                } as any);
            } else {
                throw e;
            }
        }

        let response: CipherResponse;
        try {
            if (admin) {
                response = await this.apiService.postCipherAttachmentAdmin(cipher.id, fd);
            } else {
                response = await this.apiService.postCipherAttachment(cipher.id, fd);
            }
        } catch (e) {
            throw new Error((e as ErrorResponse).getSingleMessage());
        }

        const userId = await this.userService.getUserId();
        const cData = new CipherData(response, userId, cipher.collectionIds);
        if (!admin) {
            this.upsert(cData);
        }
        return new Cipher(cData);
    }

    async saveCollectionsWithServer(cipher: Cipher): Promise<any> {
        const request = new CipherCollectionsRequest(cipher.collectionIds);
        await this.apiService.putCipherCollections(cipher.id, request);
        const userId = await this.userService.getUserId();
        const data = cipher.toCipherData(userId);
        await this.upsert(data);
    }

    async upsert(cipher: CipherData | CipherData[]): Promise<any> {
        const userId = await this.userService.getUserId();
        let ciphers = await this.storageService.get<{ [id: string]: CipherData; }>(
            Keys.ciphersPrefix + userId);
        if (ciphers == null) {
            ciphers = {};
        }

        if (cipher instanceof CipherData) {
            const c = cipher as CipherData;
            ciphers[c.id] = c;
        } else {
            (cipher as CipherData[]).forEach((c) => {
                ciphers[c.id] = c;
            });
        }

        await this.storageService.save(Keys.ciphersPrefix + userId, ciphers);
        this.decryptedCipherCache = null;
    }

    async replace(ciphers: { [id: string]: CipherData; }): Promise<any> {
        const userId = await this.userService.getUserId();
        await this.storageService.save(Keys.ciphersPrefix + userId, ciphers);
        this.decryptedCipherCache = null;
    }

    async clear(userId: string): Promise<any> {
        await this.storageService.remove(Keys.ciphersPrefix + userId);
        this.decryptedCipherCache = null;
    }

    async moveManyWithServer(ids: string[], folderId: string): Promise<any> {
        await this.apiService.putMoveCiphers(new CipherBulkMoveRequest(ids, folderId));

        const userId = await this.userService.getUserId();
        let ciphers = await this.storageService.get<{ [id: string]: CipherData; }>(
            Keys.ciphersPrefix + userId);
        if (ciphers == null) {
            ciphers = {};
        }

        ids.forEach((id) => {
            if (ciphers.hasOwnProperty(id)) {
                ciphers[id].folderId = folderId;
            }
        });

        await this.storageService.save(Keys.ciphersPrefix + userId, ciphers);
        this.decryptedCipherCache = null;
    }

    async delete(id: string | string[]): Promise<any> {
        const userId = await this.userService.getUserId();
        const ciphers = await this.storageService.get<{ [id: string]: CipherData; }>(
            Keys.ciphersPrefix + userId);
        if (ciphers == null) {
            return;
        }

        if (typeof id === 'string') {
            const i = id as string;
            delete ciphers[id];
        } else {
            (id as string[]).forEach((i) => {
                delete ciphers[i];
            });
        }

        await this.storageService.save(Keys.ciphersPrefix + userId, ciphers);
        this.decryptedCipherCache = null;
    }

    async deleteWithServer(id: string): Promise<any> {
        await this.apiService.deleteCipher(id);
        await this.delete(id);
    }

    async deleteManyWithServer(ids: string[]): Promise<any> {
        await this.apiService.deleteManyCiphers(new CipherBulkDeleteRequest(ids));
        await this.delete(ids);
    }

    async deleteAttachment(id: string, attachmentId: string): Promise<void> {
        const userId = await this.userService.getUserId();
        const ciphers = await this.storageService.get<{ [id: string]: CipherData; }>(
            Keys.ciphersPrefix + userId);

        if (ciphers == null || !ciphers.hasOwnProperty(id) || ciphers[id].attachments == null) {
            return;
        }

        for (let i = 0; i < ciphers[id].attachments.length; i++) {
            if (ciphers[id].attachments[i].id === attachmentId) {
                ciphers[id].attachments.splice(i, 1);
            }
        }

        await this.storageService.save(Keys.ciphersPrefix + userId, ciphers);
        this.decryptedCipherCache = null;
    }

    async deleteAttachmentWithServer(id: string, attachmentId: string): Promise<void> {
        try {
            await this.apiService.deleteCipherAttachment(id, attachmentId);
        } catch (e) {
            return Promise.reject((e as ErrorResponse).getSingleMessage());
        }
        await this.deleteAttachment(id, attachmentId);
    }

    sortCiphersByLastUsed(a: CipherView, b: CipherView): number {
        const aLastUsed = a.localData && a.localData.lastUsedDate ? a.localData.lastUsedDate as number : null;
        const bLastUsed = b.localData && b.localData.lastUsedDate ? b.localData.lastUsedDate as number : null;

        if (aLastUsed != null && bLastUsed != null && aLastUsed < bLastUsed) {
            return 1;
        }
        if (aLastUsed != null && bLastUsed == null) {
            return -1;
        }

        if (bLastUsed != null && aLastUsed != null && aLastUsed > bLastUsed) {
            return -1;
        }
        if (bLastUsed != null && aLastUsed == null) {
            return 1;
        }

        return 0;
    }

    sortCiphersByLastUsedThenName(a: CipherView, b: CipherView): number {
        const result = this.sortCiphersByLastUsed(a, b);
        if (result !== 0) {
            return result;
        }

        return this.getLocaleSortingFunction()(a, b);
    }

    getLocaleSortingFunction(): (a: CipherView, b: CipherView) => number {
        return (a, b) => {
            let aName = a.name;
            let bName = b.name;

            if (aName == null && bName != null) {
                return -1;
            }
            if (aName != null && bName == null) {
                return 1;
            }
            if (aName == null && bName == null) {
                return 0;
            }

            const result = this.i18nService.collator ? this.i18nService.collator.compare(aName, bName) :
                aName.localeCompare(bName);

            if (result !== 0 || a.type !== CipherType.Login || b.type !== CipherType.Login) {
                return result;
            }

            if (a.login.username != null) {
                aName += a.login.username;
            }

            if (b.login.username != null) {
                bName += b.login.username;
            }

            return this.i18nService.collator ? this.i18nService.collator.compare(aName, bName) :
                aName.localeCompare(bName);
        };
    }

    // Helpers

    private async encryptObjProperty<V extends View, D extends Domain>(model: V, obj: D,
        map: any, key: SymmetricCryptoKey): Promise<void> {
        const promises = [];
        const self = this;

        for (const prop in map) {
            if (!map.hasOwnProperty(prop)) {
                continue;
            }

            // tslint:disable-next-line
            (function (theProp, theObj) {
                const p = Promise.resolve().then(() => {
                    const modelProp = (model as any)[(map[theProp] || theProp)];
                    if (modelProp && modelProp !== '') {
                        return self.cryptoService.encrypt(modelProp, key);
                    }
                    return null;
                }).then((val: CipherString) => {
                    (theObj as any)[theProp] = val;
                });
                promises.push(p);
            })(prop, obj);
        }

        await Promise.all(promises);
    }

    private async encryptCipherData(cipher: Cipher, model: CipherView, key: SymmetricCryptoKey) {
        switch (cipher.type) {
            case CipherType.Login:
                cipher.login = new Login();
                await this.encryptObjProperty(model.login, cipher.login, {
                    username: null,
                    password: null,
                    totp: null,
                }, key);

                if (model.login.uris != null) {
                    cipher.login.uris = [];
                    for (let i = 0; i < model.login.uris.length; i++) {
                        const loginUri = new LoginUri();
                        loginUri.match = model.login.uris[i].match;
                        await this.encryptObjProperty(model.login.uris[i], loginUri, {
                            uri: null,
                        }, key);
                        cipher.login.uris.push(loginUri);
                    }
                }
                return;
            case CipherType.SecureNote:
                cipher.secureNote = new SecureNote();
                cipher.secureNote.type = model.secureNote.type;
                return;
            case CipherType.Card:
                cipher.card = new Card();
                await this.encryptObjProperty(model.card, cipher.card, {
                    cardholderName: null,
                    brand: null,
                    number: null,
                    expMonth: null,
                    expYear: null,
                    code: null,
                }, key);
                return;
            case CipherType.Identity:
                cipher.identity = new Identity();
                await this.encryptObjProperty(model.identity, cipher.identity, {
                    title: null,
                    firstName: null,
                    middleName: null,
                    lastName: null,
                    address1: null,
                    address2: null,
                    address3: null,
                    city: null,
                    state: null,
                    postalCode: null,
                    country: null,
                    company: null,
                    email: null,
                    phone: null,
                    ssn: null,
                    username: null,
                    passportNumber: null,
                    licenseNumber: null,
                }, key);
                return;
            default:
                throw new Error('Unknown cipher type.');
        }
    }
}
