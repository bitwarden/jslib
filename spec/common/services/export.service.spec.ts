import { Substitute, SubstituteOf } from '@fluffy-spoon/substitute';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CipherService } from 'jslib-common/abstractions/cipher.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { FolderService } from 'jslib-common/abstractions/folder.service';

import { ExportService } from 'jslib-common/services/export.service';

import { Cipher } from 'jslib-common/models/domain/cipher';
import { EncString } from 'jslib-common/models/domain/encString';
import { Login } from 'jslib-common/models/domain/login';
import { CipherWithIds as CipherExport } from 'jslib-common/models/export/cipherWithIds';

import { CipherType } from 'jslib-common/enums/cipherType';
import { CipherView } from 'jslib-common/models/view/cipherView';
import { LoginView } from 'jslib-common/models/view/loginView';

import { BuildTestObject, GetUniqueString } from '../../utils';

const UserCipherViews = [
    generateCipherView(false),
    generateCipherView(false),
    generateCipherView(true),
];

const UserCipherDomains = [
    generateCipherDomain(false),
    generateCipherDomain(false),
    generateCipherDomain(true),
];

function generateCipherView(deleted: boolean) {
    return BuildTestObject({
        id: GetUniqueString('id'),
        notes: GetUniqueString('notes'),
        type: CipherType.Login,
        login: BuildTestObject<LoginView>({
            username: GetUniqueString('username'),
            password: GetUniqueString('password'),
        }, LoginView),
        collectionIds: null,
        deletedDate: deleted ? new Date() : null,
    }, CipherView);
}

function generateCipherDomain(deleted: boolean) {
    return BuildTestObject({
        id: GetUniqueString('id'),
        notes: new EncString(GetUniqueString('notes')),
        type: CipherType.Login,
        login: BuildTestObject<Login>({
            username: new EncString(GetUniqueString('username')),
            password: new EncString(GetUniqueString('password')),
        }, Login),
        collectionIds: null,
        deletedDate: deleted ? new Date() : null,
    }, Cipher);
}

function expectEqualCiphers(ciphers: CipherView[] | Cipher[], jsonResult: string) {
    const actual = JSON.stringify(JSON.parse(jsonResult).items);
    const items: CipherExport[] = [];
    ciphers.forEach((c: CipherView | Cipher) => {
        const item = new CipherExport();
        item.build(c);
        items.push(item);
    });

    expect(actual).toEqual(JSON.stringify(items));
}

describe('ExportService', () => {
    let exportService: ExportService;
    let apiService: SubstituteOf<ApiService>;
    let cipherService: SubstituteOf<CipherService>;
    let folderService: SubstituteOf<FolderService>;
    let cryptoService: SubstituteOf<CryptoService>;

    beforeEach(() => {
        apiService = Substitute.for<ApiService>();
        cipherService = Substitute.for<CipherService>();
        folderService = Substitute.for<FolderService>();
        cryptoService = Substitute.for<CryptoService>();

        folderService.getAllDecrypted().resolves([]);
        folderService.getAll().resolves([]);

        exportService = new ExportService(folderService, cipherService, apiService, cryptoService);
    });

    it('exports unecrypted user ciphers', async () => {
        cipherService.getAllDecrypted().resolves(UserCipherViews.slice(0, 1));

        const actual = await exportService.getExport('json');

        expectEqualCiphers(UserCipherViews.slice(0, 1), actual);
    });

    it('exports encrypted json user ciphers', async () => {
        cipherService.getAll().resolves(UserCipherDomains.slice(0, 1));

        const actual = await exportService.getExport('encrypted_json');

        expectEqualCiphers(UserCipherDomains.slice(0, 1), actual);
    });

    it('does not unecrypted export trashed user items', async () => {
        cipherService.getAllDecrypted().resolves(UserCipherViews);

        const actual = await exportService.getExport('json');

        expectEqualCiphers(UserCipherViews.slice(0, 2), actual);
    });

    it('does not encrypted export trashed user items', async () => {
        cipherService.getAll().resolves(UserCipherDomains);

        const actual = await exportService.getExport('encrypted_json');

        expectEqualCiphers(UserCipherDomains.slice(0, 2), actual);
    });
});
