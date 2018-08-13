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
    searchText: string;
    searchPlaceholder: string = null;

    protected allCiphers: CipherView[] = [];
    protected filter: (cipher: CipherView) => boolean = null;
    protected searchPending = false;

    private searchTimeout: any = null;

    constructor(protected searchService: SearchService) { }

    async load(filter: (cipher: CipherView) => boolean = null) {
        await this.applyFilter(filter);
        this.loaded = true;
    }

    async refresh() {
        this.loaded = false;
        this.ciphers = [];
        await this.load(this.filter);
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
            return;
        }
        this.searchPending = true;
        this.searchTimeout = setTimeout(async () => {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, this.filter);
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
}
