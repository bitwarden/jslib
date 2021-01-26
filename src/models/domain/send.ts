import { CryptoService } from '../../abstractions/crypto.service';

import { SendType } from '../../enums/sendType';

import { Utils } from '../../misc/utils';

import { SendData } from '../data/sendData';

import { SendView } from '../view/sendView';

import { CipherString } from './cipherString';
import Domain from './domainBase';
import { SendFile } from './sendFile';
import { SendText } from './sendText';

export class Send extends Domain {
    id: string;
    accessId: string;
    userId: string;
    type: SendType;
    name: CipherString;
    notes: CipherString;
    file: SendFile;
    text: SendText;
    key: CipherString;
    maxAccessCount?: number;
    accessCount: number;
    revisionDate: Date;
    expirationDate: Date;
    deletionDate: Date;
    password: string;
    disabled: boolean;

    constructor(obj?: SendData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            accessId: null,
            userId: null,
            name: null,
            notes: null,
            key: null,
        }, alreadyEncrypted, ['id', 'accessId', 'userId']);

        this.type = obj.type;
        this.maxAccessCount = obj.maxAccessCount;
        this.accessCount = obj.accessCount;
        this.password = obj.password;
        this.disabled = obj.disabled;
        this.revisionDate = obj.revisionDate != null ? new Date(obj.revisionDate) : null;
        this.deletionDate = obj.deletionDate != null ? new Date(obj.deletionDate) : null;
        this.expirationDate = obj.expirationDate != null ? new Date(obj.expirationDate) : null;

        switch (this.type) {
            case SendType.Text:
                this.text = new SendText(obj.text, alreadyEncrypted);
                break;
            case SendType.File:
                this.file = new SendFile(obj.file, alreadyEncrypted);
                break;
            default:
                break;
        }
    }

    async decrypt(): Promise<SendView> {
        const model = new SendView(this);

        let cryptoService: CryptoService;
        const containerService = (Utils.global as any).bitwardenContainerService;
        if (containerService) {
            cryptoService = containerService.getCryptoService();
        } else {
            throw new Error('global bitwardenContainerService not initialized.');
        }

        try {
            model.key = await cryptoService.decryptToBytes(this.key, null);
            model.cryptoKey = await cryptoService.makeSendKey(model.key);
        } catch (e) {
            // TODO: error?
        }

        await this.decryptObj(model, {
            name: null,
            notes: null,
        }, null, model.cryptoKey);

        switch (this.type) {
            case SendType.File:
                model.file = await this.file.decrypt(model.cryptoKey);
                break;
            case SendType.Text:
                model.text = await this.text.decrypt(model.cryptoKey);
                break;
            default:
                break;
        }

        return model;
    }
}
