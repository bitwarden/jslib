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
    private filter: (cipher: CipherView) => boolean = null;

    constructor(protected cipherService: CipherService) { }

    async load(filter: (cipher: CipherView) => boolean = null) {
        this.filter = filter;
        const ciphers = await this.cipherService.getAllDecrypted();

        if (this.filter == null) {
            this.ciphers = ciphers;
        } else {
            this.ciphers = ciphers.filter(this.filter);
        }

        this.loaded = true;
    }

    async refresh() {
        this.loaded = false;
        this.ciphers = [];
        await this.load(this.filter);
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
