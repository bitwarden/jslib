import { CardData } from '../data/cardData';

import { CipherString } from './cipherString';
import Domain from './domainBase';

import { CardView } from '../view/cardView';

export class Card extends Domain {
    cardholderName: CipherString;
    brand: CipherString;
    number: CipherString;
    expMonth: CipherString;
    expYear: CipherString;
    code: CipherString;

    constructor(obj?: CardData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            cardholderName: null,
            brand: null,
            number: null,
            expMonth: null,
            expYear: null,
            code: null,
        }, alreadyEncrypted, []);
    }

    decrypt(orgId: string): Promise<CardView> {
        return this.decryptObj(new CardView(this), {
            cardholderName: null,
            brand: null,
            number: null,
            expMonth: null,
            expYear: null,
            code: null,
        }, orgId);
    }

    toCardData(): CardData {
        const c = new CardData();
        this.buildDataModel(this, c, {
            cardholderName: null,
            brand: null,
            number: null,
            expMonth: null,
            expYear: null,
            code: null,
        });
        return c;
    }
}
