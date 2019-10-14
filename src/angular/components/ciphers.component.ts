import {
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { SearchService } from '../../abstractions/search.service';

import { CipherView } from '../../models/view/cipherView';

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

    protected searchPending = false;
    protected didScroll = false;
    protected pageSize = 100;

    private searchTimeout: any = null;
    private pagedCiphersCount = 0;
    private refreshing = false;

    constructor(protected searchService: SearchService) { }

    async load(filter: (cipher: CipherView) => boolean = null) {
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

    async reload(filter: (cipher: CipherView) => boolean = null) {
        this.loaded = false;
        this.ciphers = [];
        await this.load(filter);
    }

    async refresh() {
        try {
            this.refreshing = true;
            await this.reload(this.filter);
        } finally {
            this.refreshing = false;
        }
    }

    async applyFilter(filter: (cipher: CipherView) => boolean = null) {
        this.filter = filter;
        await this.search(null);
    }

    async search(timeout: number = null) {
        this.searchPending = false;
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }
        if (timeout == null) {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, this.filter);
            await this.resetPaging();
            return;
        }
        this.searchPending = true;
        this.searchTimeout = setTimeout(async () => {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, this.filter);
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
