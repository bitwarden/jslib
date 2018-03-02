import * as lunr from 'lunr';

import { CipherView } from '../models/view/cipherView';

import { CipherService } from '../abstractions/cipher.service';
import { SearchService as SearchServiceAbstraction } from '../abstractions/search.service';

export class SearchService implements SearchServiceAbstraction {
    private index: lunr.Index;

    constructor(private cipherService: CipherService) {
    }

    async indexCiphers(): Promise<void> {
        const builder = new lunr.Builder();
        builder.ref('id');
        builder.field('name');
        builder.field('subTitle');
        builder.field('notes');
        builder.field('login_username');
        builder.field('login_uri');

        const ciphers = await this.cipherService.getAllDecrypted();
        ciphers.forEach((c) => {
            builder.add(c);
        });

        this.index = builder.build();
    }

    async searchCiphers(query: string): Promise<CipherView[]> {
        const results: CipherView[] = [];
        if (this.index == null) {
            return results;
        }

        const ciphers = await this.cipherService.getAllDecrypted();
        const ciphersMap = new Map<string, CipherView>();
        ciphers.forEach((c) => {
            ciphersMap.set(c.id, c);
        });

        query = this.transformQuery(query);
        const searchResults = this.index.search(query);
        searchResults.forEach((r) => {
            if (ciphersMap.has(r.ref)) {
                results.push(ciphersMap.get(r.ref));
            }
        });

        return results;
    }

    private transformQuery(query: string) {
        if (query.indexOf('>') === 0) {
            return query.substr(1);
        }
        return '*' + query + '*';
    }
}
