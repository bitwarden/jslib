import { Importer } from '../importer';
import { IgnoredProperties, OnePasswordCsvImporter } from './onepasswordCsvImporter';

import { CipherType } from '../../enums/cipherType';
import { CardView, CipherView, IdentityView } from '../../models/view';

export class OnePasswordMacCsvImporter extends OnePasswordCsvImporter implements Importer {
    setCipherType(value: any, cipher: CipherView) {
        const onePassType = this.getValueOrDefault(this.getProp(value, 'type'), 'Login');
        switch (onePassType) {
            case 'Credit Card':
                cipher.type = CipherType.Card;
                cipher.card = new CardView();
                IgnoredProperties.push('type');
                break;
            case 'Identity':
                cipher.type = CipherType.Identity;
                cipher.identity = new IdentityView();
                IgnoredProperties.push('type');
                break;
            case 'Login':
            case 'Secure Note':
                IgnoredProperties.push('type');
            default:
                break;
        }
    }
}
