import * as lunr from 'lunr';

import { CipherView } from '../models/view/cipherView';

import { CipherService } from '../abstractions/cipher.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { SearchService as SearchServiceAbstraction } from '../abstractions/search.service';

import { DeviceType } from '../enums/deviceType';
import { FieldType } from '../enums/fieldType';

export class SearchService implements SearchServiceAbstraction {
    private indexing = false;
    private index: lunr.Index = null;
    private onlySearchName = false;

    constructor(private cipherService: CipherService, platformUtilsService: PlatformUtilsService) {
        this.onlySearchName = platformUtilsService.getDevice() === DeviceType.EdgeExtension;
    }

    clearIndex(): void {
        this.index = null;
    }

    isSearchable(query: string): boolean {
        const notSearchable = query == null || (this.index == null && query.length < 2) ||
            (this.index != null && query.length < 2 && query.indexOf('>') !== 0);
        return !notSearchable;
    }

    async indexCiphers(): Promise<void> {
        if (this.indexing) {
            return;
        }
        // tslint:disable-next-line
        console.time('search indexing');
        this.indexing = true;
        this.index = null;
        const builder = new lunr.Builder();
        builder.ref('id');
        (builder as any).field('shortId', { boost: 100, extractor: (c: CipherView) => c.id.substr(0, 8) });
        (builder as any).field('name', { boost: 10 });
        (builder as any).field('subTitle', { boost: 5 });
        builder.field('notes');
        (builder as any).field('login.username', {
            extractor: (c: CipherView) => c.login != null ? c.login.username : null,
        });
        (builder as any).field('login.uris', {
            boost: 2,
            extractor: (c: CipherView) => c.login == null || !c.login.hasUris ? null :
                c.login.uris.filter((u) => u.hostname != null).map((u) => u.hostname),
        });
        (builder as any).field('fields', {
            extractor: (c: CipherView) => {
                if (!c.hasFields) {
                    return null;
                }
                const fields = c.fields.filter((f) => f.type === FieldType.Text).map((f) => {
                    let field = '';
                    if (f.name != null) {
                        field += f.name;
                    }
                    if (f.value != null) {
                        if (field !== '') {
                            field += ' ';
                        }
                        field += f.value;
                    }
                    return field;
                });
                return fields.filter((f) => f.trim() !== '');
            },
        });
        (builder as any).field('attachments', {
            extractor: (c: CipherView) => !c.hasAttachments ? null : c.attachments.map((a) => a.fileName),
        });
        const ciphers = await this.cipherService.getAllDecrypted();
        ciphers.forEach((c) => builder.add(c));
        this.index = builder.build();
        this.indexing = false;
        // tslint:disable-next-line
        console.timeEnd('search indexing');
    }

    async searchCiphers(query: string, filter: (cipher: CipherView) => boolean = null):
        Promise<CipherView[]> {
        const results: CipherView[] = [];
        if (query != null) {
            query = query.trim().toLowerCase();
        }
        if (query === '') {
            query = null;
        }

        let ciphers = await this.cipherService.getAllDecrypted();
        if (filter != null) {
            ciphers = ciphers.filter(filter);
        }

        if (!this.isSearchable(query)) {
            return ciphers;
        }

        if (this.index == null) {
            // Fall back to basic search if index is not available
            return this.searchCiphersBasic(ciphers, query);
        }

        const ciphersMap = new Map<string, CipherView>();
        ciphers.forEach((c) => ciphersMap.set(c.id, c));

        let searchResults: lunr.Index.Result[] = null;
        const isQueryString = query != null && query.length > 1 && query.indexOf('>') === 0;
        if (isQueryString) {
            try {
                searchResults = this.index.search(query.substr(1));
            } catch { }
        } else {
            // tslint:disable-next-line
            const soWild = lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING;
            searchResults = this.index.query((q) => {
                q.term(query, { fields: ['name'], wildcard: soWild });
                q.term(query, { fields: ['subTitle'], wildcard: soWild });
                q.term(query, { fields: ['login.uris'], wildcard: soWild });
                lunr.tokenizer(query).forEach((token) => {
                    q.term(token.toString(), {});
                });
            });
        }

        if (searchResults != null) {
            searchResults.forEach((r) => {
                if (ciphersMap.has(r.ref)) {
                    results.push(ciphersMap.get(r.ref));
                }
            });
        }
        if (results != null) {
            results.sort(this.cipherService.getLocaleSortingFunction());
        }
        return results;
    }

    searchCiphersBasic(ciphers: CipherView[], query: string) {
        query = query.trim().toLowerCase();
        return ciphers.filter((c) => {
            if (c.name != null && c.name.toLowerCase().indexOf(query) > -1) {
                return true;
            }
            if (this.onlySearchName) {
                return false;
            }
            if (query.length >= 8 && c.id.startsWith(query)) {
                return true;
            }
            if (c.subTitle != null && c.subTitle.toLowerCase().indexOf(query) > -1) {
                return true;
            }
            if (c.login && c.login.uri != null && c.login.uri.toLowerCase().indexOf(query) > -1) {
                return true;
            }
            return false;
        });
    }
}
