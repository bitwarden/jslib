import {
    Directive,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { SearchService } from 'jslib-common/abstractions/search.service';

import { CipherView } from 'jslib-common/models/view/cipherView';

@Directive()
export class CiphersComponent {
    @Input() activeCipherId: string = null;
    @Output() onCipherClicked = new EventEmitter<CipherView>();
    @Output() onCipherRightClicked = new EventEmitter<CipherView>();
    @Output() onAddCipher = new EventEmitter();
    @Output() onAddCipherOptions = new EventEmitter();

    loaded: boolean = false;
    ciphers: CipherView[] = [];
    pagedCiphers: CipherView[] = [];
    searchText: string;
    searchPlaceholder: string = null;
    filter: (cipher: CipherView) => boolean = null;
    deleted: boolean = false;

    protected searchPending = false;
    protected didScroll = false;
    protected pageSize = 100;

    private searchTimeout: any = null;
    private pagedCiphersCount = 0;
    private refreshing = false;

    constructor(protected searchService: SearchService) { }

    async load(filter: (cipher: CipherView) => boolean = null, deleted: boolean = false) {
        this.deleted = deleted || false;
        await this.applyFilter(filter);
        this.loaded = true;
    }

    loadMore() {
        if (this.ciphers.length <= this.pageSize) {
            return;
        }
        const pagedLength = this.pagedCiphers.length;
        let pagedSize = this.pageSize;
        if (this.refreshing && pagedLength === 0 && this.pagedCiphersCount > this.pageSize) {
            pagedSize = this.pagedCiphersCount;
        }
        if (this.ciphers.length > pagedLength) {
            this.pagedCiphers = this.pagedCiphers.concat(this.ciphers.slice(pagedLength, pagedLength + pagedSize));
        }
        this.pagedCiphersCount = this.pagedCiphers.length;
        this.didScroll = this.pagedCiphers.length > this.pageSize;
    }

    async reload(filter: (cipher: CipherView) => boolean = null, deleted: boolean = false) {
        this.loaded = false;
        this.ciphers = [];
        await this.load(filter, deleted);
    }

    async refresh() {
        try {
            this.refreshing = true;
            await this.reload(this.filter, this.deleted);
        } finally {
            this.refreshing = false;
        }
    }

    async applyFilter(filter: (cipher: CipherView) => boolean = null) {
        this.filter = filter;
        await this.search(null);
    }

    async search(timeout: number = null, indexedCiphers?: CipherView[]) {
        this.searchPending = false;
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }
        const deletedFilter: (cipher: CipherView) => boolean = c => c.isDeleted === this.deleted;
        if (timeout == null) {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, [this.filter, deletedFilter], indexedCiphers);
            await this.resetPaging();
            return;
        }
        this.searchPending = true;
        this.searchTimeout = setTimeout(async () => {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, [this.filter, deletedFilter], indexedCiphers);
            await this.resetPaging();
            this.searchPending = false;
        }, timeout);
    }

    selectCipher(cipher: CipherView) {
        this.onCipherClicked.emit(cipher);
    }

    rightClickCipher(cipher: CipherView) {
        this.onCipherRightClicked.emit(cipher);
    }

    addCipher() {
        this.onAddCipher.emit();
    }

    addCipherOptions() {
        this.onAddCipherOptions.emit();
    }

    isSearching() {
        return !this.searchPending && this.searchService.isSearchable(this.searchText);
    }

    isPaging() {
        const searching = this.isSearching();
        if (searching && this.didScroll) {
            this.resetPaging();
        }
        return !searching && this.ciphers.length > this.pageSize;
    }

    async resetPaging() {
        this.pagedCiphers = [];
        this.loadMore();
    }
}
