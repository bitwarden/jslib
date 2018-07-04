import {
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { CipherService } from '../../abstractions/cipher.service';

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

    constructor(protected cipherService: CipherService) { }

    async load(filter: (cipher: CipherView) => boolean = null) {
        this.allCiphers = await this.cipherService.getAllDecrypted();
        this.applyFilter(filter);
        this.loaded = true;
    }

    async refresh() {
        this.loaded = false;
        this.ciphers = [];
        await this.load(this.filter);
    }

    async applyFilter(filter: (cipher: CipherView) => boolean = null) {
        this.filter = filter;
        if (this.filter == null) {
            this.ciphers = this.allCiphers;
        } else {
            this.ciphers = this.allCiphers.filter(this.filter);
        }
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
