import { ApiService } from '../abstractions/api.service';
import { CipherService } from '../abstractions/cipher.service';
import { FolderService } from '../abstractions/folder.service';
import { I18nService } from '../abstractions/i18n.service';
import { ImportService as ImportServiceAbstraction } from '../abstractions/import.service';

import { ImportResult } from '../models/domain/importResult';

import { CipherRequest } from '../models/request/cipherRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { ImportCiphersRequest } from '../models/request/importCiphersRequest';
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

export interface ISubmitResult {
    success: boolean;
    message: string;
    shouldReport: boolean;
}

export class ImportService implements ImportServiceAbstraction {
    format: string = null;
    fileContents: string;
    formPromise: Promise<any>;

    protected successNavigate: any[] = ['vault'];

    constructor(protected cipherService: CipherService, protected folderService: FolderService,
        protected apiService: ApiService, protected i18nService: I18nService) { }

    async submit(importer: Importer, fileContents: string): Promise<ISubmitResult> {
        if (importer === null) {
            return {
                success: false,
                message: this.i18nService.t('selectFormat'),
                shouldReport: false,
            };
        }

        if (fileContents == null || fileContents === '') {
            return {
                success: false,
                message: this.i18nService.t('selectFile'),
                shouldReport: false,
            };
        }

        const importResult = await importer.parse(fileContents);
        if (importResult.success) {
            if (importResult.folders.length === 0 && importResult.ciphers.length === 0) {
                return {
                    success: false,
                    message: this.i18nService.t('importNothingError'),
                    shouldReport: true,
                };
            } else if (importResult.ciphers.length > 0) {
                const halfway = Math.floor(importResult.ciphers.length / 2);
                const last = importResult.ciphers.length - 1;
                if (this.badData(importResult.ciphers[0]) && this.badData(importResult.ciphers[halfway]) &&
                    this.badData(importResult.ciphers[last])) {
                        return {
                            success: false,
                            message: this.i18nService.t('importFormatError'),
                            shouldReport: true,
                        };
                }
            }

            try {
                this.formPromise = this.postImport(importResult);
                await this.formPromise;
                return {
                    success: true,
                    message: this.i18nService.t('importSuccess'),
                    shouldReport: true,
                };
            } catch(e) {
                return {
                    success: false,
                    message: e,
                    shouldReport: false,
                };
            }
        } else {
            return {
                success: false,
                message: this.i18nService.t('importFormatError'),
                shouldReport: false,
            };
        }
    }

    getImporter(format: string): Importer {
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
            default:
                return null;
        }
    }

    protected async postImport(importResult: ImportResult) {
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
    }

    private badData(c: CipherView) {
        return (c.name == null || c.name === '--') &&
            (c.login != null && (c.login.password == null || c.login.password === ''));
    }
}
