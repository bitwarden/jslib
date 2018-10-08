import { ApiService } from '../abstractions/api.service';
import { CipherService } from '../abstractions/cipher.service';
import { CollectionService } from '../abstractions/collection.service';
import { FolderService } from '../abstractions/folder.service';
import { I18nService } from '../abstractions/i18n.service';
import {
    ImportOption,
    ImportService as ImportServiceAbstraction,
} from '../abstractions/import.service';

import { ImportResult } from '../models/domain/importResult';

import { CipherRequest } from '../models/request/cipherRequest';
import { CollectionRequest } from '../models/request/collectionRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { ImportCiphersRequest } from '../models/request/importCiphersRequest';
import { ImportOrganizationCiphersRequest } from '../models/request/importOrganizationCiphersRequest';
import { KvpRequest } from '../models/request/kvpRequest';

import { CipherView } from '../models/view/cipherView';

import { AscendoCsvImporter } from '../importers/ascendoCsvImporter';
import { AviraCsvImporter } from '../importers/aviraCsvImporter';
import { BitwardenCsvImporter } from '../importers/bitwardenCsvImporter';
import { BlurCsvImporter } from '../importers/blurCsvImporter';
import { ChromeCsvImporter } from '../importers/chromeCsvImporter';
import { ClipperzHtmlImporter } from '../importers/clipperzHtmlImporter';
import { DashlaneCsvImporter } from '../importers/dashlaneCsvImporter';
import { EnpassCsvImporter } from '../importers/enpassCsvImporter';
import { FirefoxCsvImporter } from '../importers/firefoxCsvImporter';
import { GnomeJsonImporter } from '../importers/gnomeJsonImporter';
import { Importer } from '../importers/importer';
import { KeePass2XmlImporter } from '../importers/keepass2XmlImporter';
import { KeePassXCsvImporter } from '../importers/keepassxCsvImporter';
import { KeeperCsvImporter } from '../importers/keeperCsvImporter';
import { LastPassCsvImporter } from '../importers/lastpassCsvImporter';
import { MeldiumCsvImporter } from '../importers/meldiumCsvImporter';
import { MSecureCsvImporter } from '../importers/msecureCsvImporter';
import { OnePassword1PifImporter } from '../importers/onepassword1PifImporter';
import { OnePasswordWinCsvImporter } from '../importers/onepasswordWinCsvImporter';
import { PadlockCsvImporter } from '../importers/padlockCsvImporter';
import { PassKeepCsvImporter } from '../importers/passkeepCsvImporter';
import { PassmanJsonImporter } from '../importers/passmanJsonImporter';
import { PasspackCsvImporter } from '../importers/passpackCsvImporter';
import { PasswordAgentCsvImporter } from '../importers/passwordAgentCsvImporter';
import { PasswordBossJsonImporter } from '../importers/passwordBossJsonImporter';
import { PasswordDragonXmlImporter } from '../importers/passwordDragonXmlImporter';
import { PasswordSafeXmlImporter } from '../importers/passwordSafeXmlImporter';
import { RoboFormCsvImporter } from '../importers/roboformCsvImporter';
import { SafeInCloudXmlImporter } from '../importers/safeInCloudXmlImporter';
import { SaferPassCsvImporter } from '../importers/saferpassCsvImport';
import { SplashIdCsvImporter } from '../importers/splashIdCsvImporter';
import { StickyPasswordXmlImporter } from '../importers/stickyPasswordXmlImporter';
import { TrueKeyCsvImporter } from '../importers/truekeyCsvImporter';
import { UpmCsvImporter } from '../importers/upmCsvImporter';
import { ZohoVaultCsvImporter } from '../importers/zohoVaultCsvImporter';

export class ImportService implements ImportServiceAbstraction {
    featuredImportOptions = [
        { id: 'bitwardencsv', name: 'Bitwarden (csv)' },
        { id: 'lastpasscsv', name: 'LastPass (csv)' },
        { id: 'chromecsv', name: 'Chrome (csv)' },
        { id: 'firefoxcsv', name: 'Firefox (csv)' },
        { id: 'keepass2xml', name: 'KeePass 2 (xml)' },
        { id: '1password1pif', name: '1Password (1pif)' },
        { id: 'dashlanecsv', name: 'Dashlane (csv)' },
    ];

    regularImportOptions: ImportOption[] = [
        { id: 'keepassxcsv', name: 'KeePassX (csv)' },
        { id: '1passwordwincsv', name: '1Password 6 and 7 Windows (csv)' },
        { id: 'roboformcsv', name: 'RoboForm (csv)' },
        { id: 'keepercsv', name: 'Keeper (csv)' },
        { id: 'enpasscsv', name: 'Enpass (csv)' },
        { id: 'safeincloudxml', name: 'SafeInCloud (xml)' },
        { id: 'pwsafexml', name: 'Password Safe (xml)' },
        { id: 'stickypasswordxml', name: 'Sticky Password (xml)' },
        { id: 'msecurecsv', name: 'mSecure (csv)' },
        { id: 'truekeycsv', name: 'True Key (csv)' },
        { id: 'passwordbossjson', name: 'Password Boss (json)' },
        { id: 'zohovaultcsv', name: 'Zoho Vault (csv)' },
        { id: 'splashidcsv', name: 'SplashID (csv)' },
        { id: 'passworddragonxml', name: 'Password Dragon (xml)' },
        { id: 'padlockcsv', name: 'Padlock (csv)' },
        { id: 'passboltcsv', name: 'Passbolt (csv)' },
        { id: 'clipperzhtml', name: 'Clipperz (html)' },
        { id: 'aviracsv', name: 'Avira (csv)' },
        { id: 'saferpasscsv', name: 'SaferPass (csv)' },
        { id: 'upmcsv', name: 'Universal Password Manager (csv)' },
        { id: 'ascendocsv', name: 'Ascendo DataVault (csv)' },
        { id: 'meldiumcsv', name: 'Meldium (csv)' },
        { id: 'passkeepcsv', name: 'PassKeep (csv)' },
        { id: 'operacsv', name: 'Opera (csv)' },
        { id: 'vivaldicsv', name: 'Vivaldi (csv)' },
        { id: 'gnomejson', name: 'GNOME Passwords and Keys/Seahorse (json)' },
        { id: 'blurcsv', name: 'Blur (csv)' },
        { id: 'passwordagentcsv', name: 'Password Agent (csv)' },
        { id: 'passpackcsv', name: 'Passpack (csv)' },
        { id: 'passmanjson', name: 'Passman (json)' },
    ];

    constructor(private cipherService: CipherService, private folderService: FolderService,
        private apiService: ApiService, private i18nService: I18nService,
        private collectionService: CollectionService) { }

    getImportOptions(): ImportOption[] {
        return this.featuredImportOptions.concat(this.regularImportOptions);
    }

    async import(importer: Importer, fileContents: string, organizationId: string = null): Promise<Error> {
        const importResult = await importer.parse(fileContents);
        if (importResult.success) {
            if (importResult.folders.length === 0 && importResult.ciphers.length === 0) {
                return new Error(this.i18nService.t('importNothingError'));
            } else if (importResult.ciphers.length > 0) {
                const halfway = Math.floor(importResult.ciphers.length / 2);
                const last = importResult.ciphers.length - 1;

                if (this.badData(importResult.ciphers[0]) &&
                    this.badData(importResult.ciphers[halfway]) &&
                    this.badData(importResult.ciphers[last])) {
                    return new Error(this.i18nService.t('importFormatError'));
                }
            }
            await this.postImport(importResult, organizationId);
            return null;
        } else {
            return new Error(this.i18nService.t('importFormatError'));
        }
    }

    getImporter(format: string, organization = false): Importer {
        const importer = this.getImporterInstance(format);
        if (importer == null) {
            return null;
        }
        importer.organization = organization;
        return importer;
    }

    private getImporterInstance(format: string) {
        if (format == null || format === '') {
            return null;
        }

        switch (format) {
            case 'bitwardencsv':
                return new BitwardenCsvImporter();
            case 'lastpasscsv':
            case 'passboltcsv':
                return new LastPassCsvImporter();
            case 'keepassxcsv':
                return new KeePassXCsvImporter();
            case 'aviracsv':
                return new AviraCsvImporter();
            case 'blurcsv':
                return new BlurCsvImporter();
            case 'safeincloudxml':
                return new SafeInCloudXmlImporter();
            case 'padlockcsv':
                return new PadlockCsvImporter();
            case 'keepass2xml':
                return new KeePass2XmlImporter();
            case 'chromecsv':
            case 'operacsv':
            case 'vivaldicsv':
                return new ChromeCsvImporter();
            case 'firefoxcsv':
                return new FirefoxCsvImporter();
            case 'upmcsv':
                return new UpmCsvImporter();
            case 'saferpasscsv':
                return new SaferPassCsvImporter();
            case 'meldiumcsv':
                return new MeldiumCsvImporter();
            case '1password1pif':
                return new OnePassword1PifImporter();
            case '1passwordwincsv':
                return new OnePasswordWinCsvImporter();
            case 'keepercsv':
                return new KeeperCsvImporter();
            case 'passworddragonxml':
                return new PasswordDragonXmlImporter();
            case 'enpasscsv':
                return new EnpassCsvImporter();
            case 'pwsafexml':
                return new PasswordSafeXmlImporter();
            case 'dashlanecsv':
                return new DashlaneCsvImporter();
            case 'msecurecsv':
                return new MSecureCsvImporter();
            case 'stickypasswordxml':
                return new StickyPasswordXmlImporter();
            case 'truekeycsv':
                return new TrueKeyCsvImporter();
            case 'clipperzhtml':
                return new ClipperzHtmlImporter();
            case 'roboformcsv':
                return new RoboFormCsvImporter();
            case 'ascendocsv':
                return new AscendoCsvImporter();
            case 'passwordbossjson':
                return new PasswordBossJsonImporter();
            case 'zohovaultcsv':
                return new ZohoVaultCsvImporter();
            case 'splashidcsv':
                return new SplashIdCsvImporter();
            case 'passkeepcsv':
                return new PassKeepCsvImporter();
            case 'gnomejson':
                return new GnomeJsonImporter();
            case 'passwordagentcsv':
                return new PasswordAgentCsvImporter();
            case 'passpackcsv':
                return new PasspackCsvImporter();
            case 'passmanjson':
                return new PassmanJsonImporter();
            default:
                return null;
        }
    }

    private async postImport(importResult: ImportResult, organizationId: string = null) {
        if (organizationId == null) {
            const request = new ImportCiphersRequest();
            for (let i = 0; i < importResult.ciphers.length; i++) {
                const c = await this.cipherService.encrypt(importResult.ciphers[i]);
                request.ciphers.push(new CipherRequest(c));
            }
            if (importResult.folders != null) {
                for (let i = 0; i < importResult.folders.length; i++) {
                    const f = await this.folderService.encrypt(importResult.folders[i]);
                    request.folders.push(new FolderRequest(f));
                }
            }
            if (importResult.folderRelationships != null) {
                importResult.folderRelationships.forEach((r) =>
                    request.folderRelationships.push(new KvpRequest(r[0], r[1])));
            }
            return await this.apiService.postImportCiphers(request);
        } else {
            const request = new ImportOrganizationCiphersRequest();
            for (let i = 0; i < importResult.ciphers.length; i++) {
                importResult.ciphers[i].organizationId = organizationId;
                const c = await this.cipherService.encrypt(importResult.ciphers[i]);
                request.ciphers.push(new CipherRequest(c));
            }
            if (importResult.collections != null) {
                for (let i = 0; i < importResult.collections.length; i++) {
                    importResult.collections[i].organizationId = organizationId;
                    const c = await this.collectionService.encrypt(importResult.collections[i]);
                    request.collections.push(new CollectionRequest(c));
                }
            }
            if (importResult.collectionRelationships != null) {
                importResult.collectionRelationships.forEach((r) =>
                    request.collectionRelationships.push(new KvpRequest(r[0], r[1])));
            }
            return await this.apiService.postImportOrganizationCiphers(organizationId, request);
        }
    }

    private badData(c: CipherView) {
        return (c.name == null || c.name === '--') &&
            (c.login != null && (c.login.password == null || c.login.password === ''));
    }
}
