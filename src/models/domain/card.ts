import { CardData } from '../data/cardData';

import Domain from './domainBase';
import { EncString } from './encString';

import { CardView } from '../view/cardView';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

export class Card extends Domain {
    cardholderName: EncString;
    brand: EncString;
    number: EncString;
    expMonth: EncString;
    expYear: EncString;
    code: EncString;

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

    decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<CardView> {
        return this.decryptObj(new CardView(this), {
            cardholderName: null,
            brand: null,
            number: null,
            expMonth: null,
            expYear: null,
            code: null,
        }, orgId, encKey);
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
